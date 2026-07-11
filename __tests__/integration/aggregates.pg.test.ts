/**
 * Intégration PG — agrégats migrés en SQL ciblé (C5+).
 * Un bloc describe par agrégat ; requiert TEST_DATABASE_URL ; base réinitialisée.
 */
import { describe, expect, it, beforeAll, afterAll } from "vitest";

const TEST_URL = process.env.TEST_DATABASE_URL;

describe.skipIf(!TEST_URL)("agrégats SQL (intégration PG)", () => {
  let sqlClient: typeof import("@/infrastructure/persistence/sql/sql-client");
  let content: typeof import("@/infrastructure/repositories/content.repository");

  beforeAll(async () => {
    process.env.DATABASE_URL = TEST_URL;
    process.env.CFM_PG_NORMALIZED = "true";

    const pg = await import("pg");
    const admin = new pg.Pool({ connectionString: TEST_URL, connectionTimeoutMillis: 5000 });
    await admin.query("DROP SCHEMA public CASCADE; CREATE SCHEMA public;");
    await admin.end();

    sqlClient = await import("@/infrastructure/persistence/sql/sql-client");
    content = await import("@/infrastructure/repositories/content.repository");
    await sqlClient.ensureSchemaOnce();
  });

  afterAll(async () => {
    await sqlClient.closePoolForTests();
  });

  describe("newsletter (C5)", () => {
    it("inscription : insère avec id de séquence, trim + lowercase", async () => {
      await content.addNewsletter("  Nl.One@Ex.com ");
      const subs = await content.listNewsletterSubscribers();
      expect(subs).toHaveLength(1);
      expect(subs[0].email).toBe("nl.one@ex.com");
      expect(subs[0].id).toBeGreaterThan(100);
    });

    it("doublon (casse différente) → ALREADY_EXISTS via idx_newsletter_email", async () => {
      await expect(content.addNewsletter("NL.ONE@EX.COM")).rejects.toMatchObject({
        code: "ALREADY_EXISTS",
      });
    });

    it("liste id DESC + désinscription", async () => {
      await content.addNewsletter("nl.two@ex.com");
      const subs = await content.listNewsletterSubscribers();
      expect(subs.map((s) => s.email)).toEqual(["nl.two@ex.com", "nl.one@ex.com"]);
      expect(await content.deleteNewsletterSubscriber(subs[0].id)).toBe(true);
      expect(await content.deleteNewsletterSubscriber(subs[0].id)).toBe(false);
      expect(await content.listNewsletterSubscribers()).toHaveLength(1);
    });

    it("écritures parallèles : 10/10 persistées", async () => {
      const emails = Array.from({ length: 10 }, (_, i) => `bulk${i}@nl.ex`);
      await Promise.all(emails.map((e) => content.addNewsletter(e)));
      const subs = await content.listNewsletterSubscribers();
      expect(subs.filter((s) => s.email.startsWith("bulk"))).toHaveLength(10);
    });
  });

  describe("push_subscriptions (C6)", () => {
    it("abonnement : upsert par endpoint (id conservé, champs rafraîchis)", async () => {
      const push = await import("@/infrastructure/push/web-push.adapter");
      await push.savePushSubscription({
        endpoint: "https://push/ep-a", p256dh: "k1", auth: "a1", topics: ["lives"],
      });
      const first = await sqlClient.query<{ id: number; p256dh: string }>(
        "SELECT id, p256dh FROM push_subscriptions WHERE endpoint = 'https://push/ep-a'"
      );
      await push.savePushSubscription({
        endpoint: "https://push/ep-a", p256dh: "k2", auth: "a2", topics: ["lives", "campaigns"],
      });
      const second = await sqlClient.query<{ id: number; p256dh: string; topics: string[] }>(
        "SELECT id, p256dh, topics FROM push_subscriptions WHERE endpoint = 'https://push/ep-a'"
      );
      expect(second.rows).toHaveLength(1);
      expect(second.rows[0].id).toBe(first.rows[0].id);
      expect(second.rows[0].p256dh).toBe("k2");
      expect(second.rows[0].topics).toEqual(["lives", "campaigns"]);
    });

    it("compteurs par topic + désabonnement", async () => {
      const push = await import("@/infrastructure/push/web-push.adapter");
      await push.savePushSubscription({
        endpoint: "https://push/ep-b", p256dh: "k", auth: "a", topics: ["campaigns"],
      });
      expect(await push.getPushSubscriberCount()).toBe(2);
      expect(await push.getPushSubscriberCount("campaigns")).toBe(2);
      expect(await push.getPushSubscriberCount("lives")).toBe(1);
      await push.removePushSubscription("https://push/ep-a");
      expect(await push.getPushSubscriberCount()).toBe(1);
    });
  });

  describe("formulaires (C7)", () => {
    it("adhésion : data JSONB = objet complet, id séquence cohérent colonne/objet", async () => {
      await content.addMembership({
        type: "famille",
        first_name: "Jean",
        last_name: "K",
        phone: "0999",
        province: "Kinshasa",
      });
      const res = await sqlClient.query<{ id: number; data: Record<string, unknown> }>(
        "SELECT id, data FROM memberships ORDER BY id"
      );
      expect(res.rows).toHaveLength(1);
      const row = res.rows[0];
      expect(row.id).toBeGreaterThan(100);
      expect(row.data.id).toBe(row.id);
      expect(row.data).toMatchObject({
        type: "famille",
        first_name: "Jean",
        last_name: "K",
        phone: "0999",
        province: "Kinshasa",
        status: "pending",
      });
      expect(typeof row.data.created_at).toBe("string");
    });

    it("demande d'aide + suivi : transaction (ligne de suivi + statut colonne ET data)", async () => {
      await content.addHelpRequest({
        first_name: "Marie",
        need_type: "sante",
        province: "Goma",
        email: "marie@ex.cd",
      });
      const created = (await content.listHelpRequestsRaw())[0];
      expect(created.status).toBe("new");
      const helpId = created.id as number;

      const users = await import("@/infrastructure/repositories/users.repository");
      const update = await users.addHelpRequestUpdate({
        help_request_id: helpId,
        status: "in_progress",
        note: "Dossier pris en charge",
        updated_by: "admin",
      });
      expect(update.help_request_id).toBe(helpId);

      const updates = await users.getHelpRequestUpdates(helpId);
      expect(updates).toHaveLength(1);
      expect(updates[0]).toMatchObject({
        id: update.id,
        status: "in_progress",
        note: "Dossier pris en charge",
        updated_by: "admin",
      });

      const after = await content.getHelpRequestById(helpId);
      expect(after?.status).toBe("in_progress");
      const col = await sqlClient.query<{ status: string }>(
        "SELECT status FROM help_requests WHERE id = $1",
        [helpId]
      );
      expect(col.rows[0].status).toBe("in_progress");
    });

    it("contact : ajout + changement de statut", async () => {
      await content.addContactMessage({ name: "Alice", email: "a@b.cd", message: "Bonjour" });
      const res = await sqlClient.query<{ id: number; data: Record<string, unknown> }>(
        "SELECT id, data FROM contact_messages ORDER BY id"
      );
      expect(res.rows).toHaveLength(1);
      expect(res.rows[0].data).toMatchObject({
        id: res.rows[0].id,
        name: "Alice",
        status: "new",
      });

      expect(await content.updateContactStatus(res.rows[0].id, "read")).toBe(true);
      expect(await content.updateContactStatus(999999, "read")).toBe(false);
      const after = await sqlClient.query<{ status: string }>(
        "SELECT data->>'status' AS status FROM contact_messages WHERE id = $1",
        [res.rows[0].id]
      );
      expect(after.rows[0].status).toBe("read");
    });

    it("listes admin id DESC (memberships / help_requests / contacts)", async () => {
      const forms = await import("@/infrastructure/repositories/sql/forms.sql");
      await content.addMembership({
        type: "benevole",
        first_name: "Paul",
        last_name: "M",
        phone: "0888",
      });
      await content.addHelpRequest({ first_name: "Luc", need_type: "juridique" });
      await content.addContactMessage({ name: "Bob", email: "b@c.de", message: "Salut" });

      const memberships = await forms.listMembershipsDesc();
      expect(memberships.map((m) => m.first_name)).toEqual(["Paul", "Jean"]);
      const help = await forms.listHelpRequestsDesc();
      expect(help.map((h) => h.first_name)).toEqual(["Luc", "Marie"]);
      const contacts = await forms.listContactMessagesDesc();
      expect(contacts.map((c) => c.name)).toEqual(["Bob", "Alice"]);

      const counters = await forms.getFormsAdminCounters();
      expect(counters).toEqual({
        memberships: 2,
        help_requests: 2,
        contacts: 2,
        pending_memberships: 2,
        new_help: 1,
      });

      const dates = await content.getFormsActivityDates();
      expect(dates.memberships).toHaveLength(2);
      expect(dates.help).toHaveLength(2);
      expect(dates.contacts).toHaveLength(2);
      expect(dates.help.every((d) => typeof d === "string" && d.length > 0)).toBe(true);
    });

    it("écritures parallèles : 10 addContactMessage → 10 persistés", async () => {
      await Promise.all(
        Array.from({ length: 10 }, (_, i) =>
          content.addContactMessage({ name: `Bulk${i}`, email: `bulk${i}@c.cd`, message: "m" })
        )
      );
      const res = await sqlClient.query<{ n: number }>(
        "SELECT COUNT(*)::int AS n FROM contact_messages WHERE data->>'name' LIKE 'Bulk%'"
      );
      expect(res.rows[0].n).toBe(10);
    });
  });

  describe("users + auth (C8)", () => {
    let users: typeof import("@/infrastructure/repositories/users.repository");
    let familyLinks: typeof import("@/infrastructure/repositories/family-links.repository");
    let passwordReset: typeof import("@/infrastructure/auth/password-reset");
    let parentId: number;
    let childId: number;

    beforeAll(async () => {
      users = await import("@/infrastructure/repositories/users.repository");
      familyLinks = await import("@/infrastructure/repositories/family-links.repository");
      passwordReset = await import("@/infrastructure/auth/password-reset");
    });

    it("register : id séquence, email trim + lowercase, statut pending", async () => {
      const created = await users.registerUser({
        email: "  Parent.One@Ex.CD ",
        password: "motdepasse1",
        first_name: "Papa",
        last_name: "K",
        phone: "0991",
        province: "Kinshasa",
        membership_type: "famille",
        military_link: "epoux",
      });
      parentId = created.id;
      expect(created.id).toBeGreaterThan(100);
      expect(created.email).toBe("parent.one@ex.cd");
      expect(created.role).toBe("member");
      expect(created.status).toBe("pending");
      expect(created.verified_at).toBeNull();
      expect(typeof created.created_at).toBe("string");
    });

    it("doublon d'email (casse différente) → EMAIL_EXISTS", async () => {
      await expect(
        users.registerUser({
          email: "PARENT.ONE@EX.CD",
          password: "motdepasse1",
          first_name: "Dup",
          last_name: "K",
          phone: "0000",
          membership_type: "soutien",
        })
      ).rejects.toMatchObject({ code: "EMAIL_EXISTS" });
    });

    it("contrainte users_email_key : INSERT direct en doublon → EMAIL_EXISTS", async () => {
      const sqlUsers = await import("@/infrastructure/repositories/sql/users.sql");
      await expect(
        sqlUsers.createUser({
          email: "Parent.One@Ex.CD",
          password_hash: "x",
          first_name: "Race",
          last_name: "K",
          phone: "0000",
          role: "member",
          membership_type: "soutien",
        })
      ).rejects.toMatchObject({ code: "EMAIL_EXISTS" });
    });

    it("lookup par email insensible à la casse + login", async () => {
      const found = await users.getUserByEmail("  PARENT.ONE@ex.cd ");
      expect(found?.id).toBe(parentId);
      const ok = await users.verifyUserPassword("Parent.One@EX.CD", "motdepasse1");
      expect(ok?.id).toBe(parentId);
      expect(await users.verifyUserPassword("parent.one@ex.cd", "mauvais-mdp")).toBeNull();
      expect(await users.getUserByEmail("inconnu@ex.cd")).toBeUndefined();
    });

    it("activate / suspend + profil", async () => {
      const activated = await users.activateUser(parentId);
      expect(activated?.status).toBe("active");
      expect(activated?.verified_at).toBeTruthy();

      const updated = await users.updateMemberProfile(parentId, {
        first_name: "  Papa-Maj  ",
        phone: " 0992 ",
      });
      expect(updated?.first_name).toBe("Papa-Maj");
      expect(updated?.phone).toBe("0992");
      expect(updated?.last_name).toBe("K");

      await users.suspendUser(parentId);
      expect((await users.getUserById(parentId))?.status).toBe("suspended");

      // Ré-activation pour la suite (liens familiaux).
      expect((await users.activateUser(parentId))?.status).toBe("active");
      expect(await users.activateUser(999999)).toBeUndefined();
    });

    it("cycle reset password complet en transaction", async () => {
      const token1 = await passwordReset.createPasswordResetToken(parentId);
      expect(token1).toMatch(/^[0-9a-f]{64}$/);

      // Un nouveau token invalide le précédent (non utilisé → supprimé).
      const token2 = await passwordReset.createPasswordResetToken(parentId);
      expect(await passwordReset.getValidResetToken(token1)).toBeNull();
      const valid = await passwordReset.getValidResetToken(token2);
      expect(valid?.user_id).toBe(parentId);
      expect(valid?.used).toBe(0);

      await expect(
        passwordReset.resetPasswordWithToken(token2, "court")
      ).rejects.toMatchObject({ code: "PASSWORD_TOO_SHORT" });

      await passwordReset.resetPasswordWithToken(token2, "nouveaumdp1");

      // Token consommé : refusé au second passage.
      await expect(
        passwordReset.resetPasswordWithToken(token2, "encoreunautre1")
      ).rejects.toMatchObject({ code: "INVALID_TOKEN" });
      expect(await passwordReset.getValidResetToken(token2)).toBeNull();

      // Login : nouveau hash actif, ancien mot de passe refusé.
      expect(await users.verifyUserPassword("parent.one@ex.cd", "motdepasse1")).toBeNull();
      const ok = await users.verifyUserPassword("parent.one@ex.cd", "nouveaumdp1");
      expect(ok?.id).toBe(parentId);

      await expect(
        passwordReset.resetPasswordWithToken("token-inconnu", "nouveaumdp1")
      ).rejects.toMatchObject({ code: "INVALID_TOKEN" });
    });

    it("family link : invitation parent, gardes domaine, approve/reject", async () => {
      const child = await users.registerUser({
        email: "enfant.one@ex.cd",
        password: "motdepasse1",
        first_name: "Fille",
        last_name: "K",
        phone: "0993",
        membership_type: "soutien",
      });
      childId = child.id;

      await expect(
        familyLinks.requestFamilyLinkByParent({
          parent_user_id: parentId,
          child_email: "inconnu@ex.cd",
          relationship: "enfant",
        })
      ).rejects.toMatchObject({ code: "CHILD_NOT_FOUND" });

      await expect(
        familyLinks.requestFamilyLinkByParent({
          parent_user_id: parentId,
          child_email: "parent.one@ex.cd",
          relationship: "enfant",
        })
      ).rejects.toMatchObject({ code: "SELF_LINK" });

      // Un compte non « famille » ne peut pas inviter.
      await expect(
        familyLinks.requestFamilyLinkByParent({
          parent_user_id: childId,
          child_email: "parent.one@ex.cd",
          relationship: "parent",
        })
      ).rejects.toMatchObject({ code: "NOT_FAMILY_PARENT" });

      const link = await familyLinks.requestFamilyLinkByParent({
        parent_user_id: parentId,
        child_email: "ENFANT.ONE@EX.CD",
        relationship: "enfant",
      });
      expect(link.id).toBeGreaterThan(100);
      expect(link.status).toBe("pending_child");
      expect(link.initiated_by).toBe("parent");

      await expect(
        familyLinks.requestFamilyLinkByParent({
          parent_user_id: parentId,
          child_email: "enfant.one@ex.cd",
          relationship: "enfant",
        })
      ).rejects.toMatchObject({ code: "LINK_EXISTS" });

      // Seul l'enfant destinataire peut répondre à pending_child.
      await expect(
        familyLinks.respondFamilyLink(link.id, parentId, true)
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
      await expect(
        familyLinks.respondFamilyLink(999999, childId, true)
      ).rejects.toMatchObject({ code: "NOT_FOUND" });

      await familyLinks.respondFamilyLink(link.id, childId, true);
      const links = await familyLinks.getFamilyLinksForUser(parentId);
      expect(links).toHaveLength(1);
      expect(links[0].status).toBe("approved");
    });

    it("family link : demande enfant, rejet puis re-demande, admin approve", async () => {
      await expect(
        familyLinks.requestFamilyLinkByChild({
          child_user_id: childId,
          parent_email: "inconnu@ex.cd",
          relationship: "parent",
        })
      ).rejects.toMatchObject({ code: "PARENT_NOT_FOUND" });

      const parent2 = await users.registerUser({
        email: "parent.two@ex.cd",
        password: "motdepasse1",
        first_name: "Maman",
        last_name: "M",
        phone: "0994",
        province: "Goma",
        membership_type: "famille",
        military_link: "epouse",
      });

      const link = await familyLinks.requestFamilyLinkByChild({
        child_user_id: childId,
        parent_email: "Parent.Two@Ex.CD",
        relationship: "parent",
      });
      expect(link.status).toBe("pending_parent");
      expect(link.initiated_by).toBe("child");

      // Seul le parent destinataire peut répondre à pending_parent.
      await expect(
        familyLinks.respondFamilyLink(link.id, childId, true)
      ).rejects.toMatchObject({ code: "FORBIDDEN" });

      await familyLinks.respondFamilyLink(link.id, parent2.id, false);
      let all = await familyLinks.getAllFamilyLinks();
      expect(all[0].id).toBe(link.id);
      expect(all[0].status).toBe("rejected");

      // Lien rejeté : une nouvelle demande du même couple est autorisée.
      const retry = await familyLinks.requestFamilyLinkByChild({
        child_user_id: childId,
        parent_email: "parent.two@ex.cd",
        relationship: "parent",
      });
      expect(retry.id).toBeGreaterThan(link.id);

      await familyLinks.adminApproveFamilyLink(retry.id);
      all = await familyLinks.getAllFamilyLinks();
      expect(all.find((l) => l.id === retry.id)?.status).toBe("approved");

      await familyLinks.adminRejectFamilyLink(retry.id);
      all = await familyLinks.getAllFamilyLinks();
      expect(all.find((l) => l.id === retry.id)?.status).toBe("rejected");
      // Liens admin listés id DESC.
      expect(all.map((l) => l.id)).toEqual([...all.map((l) => l.id)].sort((a, b) => b - a));

      // Admin sur id inconnu : no-op silencieux (parité Store).
      await familyLinks.adminApproveFamilyLink(999999);
    });

    it("compteurs et satellites C2", async () => {
      const counters = await users.getUserAdminCounters();
      expect(counters.users).toBe(3);
      expect(counters.pendingUsers).toBe(2); // enfant + parent.two jamais activés

      expect(await users.countFamilyUsers()).toBe(2);
      expect(await users.countFamilyUsers("Kinshasa")).toBe(1);
      expect(await users.countFamilyUsers("Lubumbashi")).toBe(0);

      const dates = await users.listUserCreationDates();
      expect(dates).toHaveLength(3);
      expect(dates.every((d) => typeof d === "string" && d.length > 0)).toBe(true);

      const all = await users.getAllUsers();
      expect(all.map((u) => u.id)).toEqual([...all.map((u) => u.id)].sort((a, b) => b - a));

      const familyCounters = await familyLinks.getFamilyLinkCounters();
      expect(familyCounters.total).toBe(3); // approuvé + rejeté + rejeté
      expect(familyCounters.pending).toBe(0); // approved + rejected exclus
    });
  });
});
