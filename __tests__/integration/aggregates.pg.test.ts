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

  describe("donations (C9)", () => {
    let donations: typeof import("@/infrastructure/repositories/donations.repository");
    let firstId: number;
    let donorUserId: number;

    beforeAll(async () => {
      donations = await import("@/infrastructure/repositories/donations.repository");
    });

    it("create : id séquence, retour conforme, amount number malgré DECIMAL", async () => {
      const created = await donations.createDonation({
        amount: 25.5,
        currency: "USD",
        provider: "orange",
        phone: "0991",
        donor_name: "Donateur Un",
      });
      firstId = created.id;
      expect(created.id).toBeGreaterThan(100);
      expect(created.user_id).toBeNull();
      expect(created.amount).toBe(25.5);
      expect(typeof created.amount).toBe("number");
      expect(created.currency).toBe("USD");
      expect(created.provider).toBe("orange");
      expect(created.phone).toBe("0991");
      expect(created.transaction_id).toBeNull();
      expect(created.status).toBe("pending");
      expect(created.donor_name).toBe("Donateur Un");
      expect(created.donor_email).toBeNull();
      expect(typeof created.created_at).toBe("string");
      expect(created.created_at.length).toBeGreaterThan(0);
    });

    it("webhook : handleDonationWebhook → statut completed + transaction_id", async () => {
      const service = await import("@/application/services/donation.service");
      const completed = await service.handleDonationWebhook(firstId, "TX-001");
      expect(completed?.id).toBe(firstId);
      expect(completed?.status).toBe("completed");
      expect(completed?.transaction_id).toBe("TX-001");
      expect(typeof completed?.amount).toBe("number");

      // Persisté (relecture) + id inconnu → undefined.
      const col = await sqlClient.query<{ status: string; transaction_id: string }>(
        "SELECT status, transaction_id FROM donations WHERE id = $1",
        [firstId]
      );
      expect(col.rows[0]).toEqual({ status: "completed", transaction_id: "TX-001" });
      expect(await service.completeDonation(999999, "TX-NOPE")).toBeUndefined();
    });

    it("update admin : patch partiel, patch vide inchangé, id inconnu → undefined", async () => {
      const failed = await donations.adminUpdateDonation(firstId, { status: "failed" });
      expect(failed?.status).toBe("failed");
      expect(failed?.transaction_id).toBe("TX-001"); // non touché

      const cleared = await donations.adminUpdateDonation(firstId, {
        status: "completed",
        transaction_id: null,
      });
      expect(cleared?.status).toBe("completed");
      expect(cleared?.transaction_id).toBeNull();

      // Patch vide : renvoie le don inchangé (parité Store).
      const untouched = await donations.adminUpdateDonation(firstId, {});
      expect(untouched?.status).toBe("completed");
      expect(untouched?.transaction_id).toBeNull();

      expect(await donations.adminUpdateDonation(999999, { status: "failed" })).toBeUndefined();
    });

    it("listes : getAllDonations id DESC, dons d'un membre ordre d'insertion", async () => {
      const users = await import("@/infrastructure/repositories/users.repository");
      const donor = await users.registerUser({
        email: "donateur.one@ex.cd",
        password: "motdepasse1",
        first_name: "Don",
        last_name: "K",
        phone: "0995",
        membership_type: "soutien",
      });
      donorUserId = donor.id;

      const d2 = await donations.createDonation({
        user_id: donorUserId,
        amount: 100,
        currency: "CDF",
        provider: "mpesa",
        phone: "0995",
        donor_email: "donateur.one@ex.cd",
      });
      expect(d2.user_id).toBe(donorUserId);
      const d3 = await donations.createDonation({
        user_id: donorUserId,
        amount: 40,
        currency: "USD",
        provider: "airtel",
        phone: "0995",
      });

      const all = await donations.getAllDonations();
      expect(all.map((d) => d.id)).toEqual([d3.id, d2.id, firstId]);
      expect(all.every((d) => typeof d.amount === "number")).toBe(true);
      expect(all.find((d) => d.id === d2.id)?.amount).toBe(100);

      const mine = await donations.getDonationsForUser(donorUserId);
      expect(mine.map((d) => d.id)).toEqual([d2.id, d3.id]);
      expect(await donations.getDonationsForUser(999999)).toEqual([]);
    });

    it("compteurs et dates de création", async () => {
      expect(await donations.countDonations()).toBe(3);
      const dates = await donations.listDonationCreationDates();
      expect(dates).toHaveLength(3);
      expect(dates.every((d) => typeof d === "string" && d.length > 0)).toBe(true);
    });
  });

  describe("live (C10)", () => {
    let live: typeof import("@/infrastructure/repositories/live.repository");
    let eventId: number;
    let pollId: number;

    beforeAll(async () => {
      live = await import("@/infrastructure/repositories/live.repository");
    });

    it("seed hook : live fikin-2025 seedé une fois, idempotent", async () => {
      const hooks = await import("@/infrastructure/persistence/sql/seed-hooks");
      await hooks.seedMigratedAggregates();
      await hooks.seedMigratedAggregates();
      const res = await sqlClient.query<{ n: number }>(
        "SELECT COUNT(*)::int AS n FROM live_events"
      );
      expect(res.rows[0].n).toBe(1);
      const seeded = await live.getLiveEventBySlug("fikin-2025");
      expect(seeded?.status).toBe("replay");
      expect(seeded?.replay_url).toBe("https://youtube.com/@cfmasbl");
      expect(seeded?.chat_moderation).toBe(1);
      expect(seeded?.id).toBeGreaterThan(100);
    });

    it("create : id séquence, slug auto-suffixé en cas de collision", async () => {
      const a = await live.createLiveEvent({
        title: "Assemblée Générale",
        description: "Session annuelle",
      });
      eventId = a.id;
      expect(a.id).toBeGreaterThan(100);
      expect(a.slug).toBe("assemblee-generale");
      expect(a.status).toBe("scheduled");
      expect(a.chat_moderation).toBe(0);
      expect(a.viewer_count).toBe(0);
      expect(a.started_at).toBeNull();
      expect(typeof a.created_at).toBe("string");

      const b = await live.createLiveEvent({
        title: "Assemblée Générale",
        description: "Doublon de titre",
        chat_moderation: true,
      });
      expect(b.slug).toBe("assemblee-generale-1");
      expect(b.chat_moderation).toBe(1);

      expect((await live.getLiveEventBySlug("assemblee-generale"))?.id).toBe(a.id);
      const all = await live.getLiveEvents();
      expect(all).toHaveLength(3);
    });

    it("setStatus : live pose started_at et rétrograde l'autre live ; ended/replay posent ended_at + replay_url", async () => {
      const started = await live.setLiveEventStatus(eventId, "live");
      expect(started?.status).toBe("live");
      expect(started?.started_at).toBeTruthy();
      expect(started?.ended_at).toBeNull();
      expect((await live.getActiveLiveEvent())?.id).toBe(eventId);

      // Un second event passe live → le premier est rétrogradé "ended".
      const b = await live.getLiveEventBySlug("assemblee-generale-1");
      await live.setLiveEventStatus(b!.id, "live");
      expect((await live.getLiveEventBySlug("assemblee-generale"))?.status).toBe("ended");

      const replay = await live.setLiveEventStatus(b!.id, "replay", "https://yt/replay-b");
      expect(replay?.status).toBe("replay");
      expect(replay?.ended_at).toBeTruthy();
      expect(replay?.replay_url).toBe("https://yt/replay-b");

      // id inconnu : undefined et AUCUN effet de bord sur les autres events.
      await live.setLiveEventStatus(eventId, "live");
      expect(await live.setLiveEventStatus(999999, "live")).toBeUndefined();
      expect((await live.getActiveLiveEvent())?.id).toBe(eventId);
    });

    it("chat : post approuvé sans modération, pending avec, moderate + pendingCount", async () => {
      const auto = await live.postChatMessage({
        live_event_id: eventId,
        author_name: "Momo",
        content: "  Bonjour à tous  ",
      });
      expect(auto.status).toBe("approved"); // chat_moderation 0
      expect(auto.content).toBe("Bonjour à tous"); // sanitizé (trim)
      expect(auto.user_id).toBeNull();

      // Gros mot → pending même sans modération.
      const bad = await live.postChatMessage({
        live_event_id: eventId,
        author_name: "Troll",
        content: "espèce d'idiot",
      });
      expect(bad.status).toBe("pending");

      // Modération activée → tout passe pending.
      const updated = await live.updateLiveEvent(eventId, { chat_moderation: 1 });
      expect(updated?.chat_moderation).toBe(1);
      const modded = await live.postChatMessage({
        live_event_id: eventId,
        author_name: "Awa",
        content: "Message sage",
      });
      expect(modded.status).toBe("pending");
      expect(await live.getPendingChatCount(eventId)).toBe(2);

      // Liste publique : approuvés seulement, ordre chronologique ascendant.
      let pub = await live.getChatMessages(eventId);
      expect(pub.map((m) => m.id)).toEqual([auto.id]);
      const allMsgs = await live.getChatMessages(eventId, false);
      expect(allMsgs.map((m) => m.id)).toEqual([auto.id, bad.id, modded.id]);

      const { msg, event } = await live.getChatMessageWithEvent(modded.id);
      expect(msg?.id).toBe(modded.id);
      expect(event?.id).toBe(eventId);

      await live.moderateChatMessage(modded.id, "approved");
      await live.moderateChatMessage(bad.id, "rejected");
      await live.moderateChatMessage(999999, "approved"); // no-op silencieux
      expect(await live.getPendingChatCount(eventId)).toBe(0);
      pub = await live.getChatMessages(eventId);
      expect(pub.map((m) => m.id)).toEqual([auto.id, modded.id]);

      const counters = await live.getLiveAdminCounters();
      expect(counters.liveEvents).toBe(3);
      expect(counters.pendingChat).toBe(0);
    });

    it("chat : erreurs EMPTY_MESSAGE / EVENT_NOT_FOUND / NOT_LIVE", async () => {
      await expect(
        live.postChatMessage({ live_event_id: eventId, author_name: "X", content: "   " })
      ).rejects.toMatchObject({ code: "EMPTY_MESSAGE" });
      await expect(
        live.postChatMessage({ live_event_id: 999999, author_name: "X", content: "Salut" })
      ).rejects.toMatchObject({ code: "EVENT_NOT_FOUND" });
      const replayEvent = await live.getLiveEventBySlug("assemblee-generale-1");
      await expect(
        live.postChatMessage({
          live_event_id: replayEvent!.id,
          author_name: "X",
          content: "Salut",
        })
      ).rejects.toMatchObject({ code: "NOT_LIVE" });
    });

    it("poll : create + 10 votes parallèles distincts → 10 persistés, options cohérentes", async () => {
      const poll = await live.createLivePoll(eventId, "Quel axe prioriser ?", ["Santé", "Éducation"]);
      pollId = poll.id;
      expect(poll.id).toBeGreaterThan(100);
      expect(poll.active).toBe(1);
      expect(poll.options).toEqual([
        { id: "opt-1", text: "Santé", votes: 0 },
        { id: "opt-2", text: "Éducation", votes: 0 },
      ]);
      expect((await live.getPollsForEvent(eventId)).map((p) => p.id)).toEqual([poll.id]);

      await Promise.all(
        Array.from({ length: 10 }, (_, i) =>
          live.voteLivePoll(pollId, i % 2 === 0 ? "opt-1" : "opt-2", `voter-${i}`)
        )
      );
      const votes = await live.getPollVotes(pollId);
      expect(votes).toHaveLength(10);
      const after = await live.getPollById(pollId);
      const byId = Object.fromEntries(after!.options.map((o) => [o.id, o.votes]));
      expect(byId).toEqual({ "opt-1": 5, "opt-2": 5 });
    });

    it("poll : doublon voter_key → ALREADY_VOTED, option inconnue → INVALID_OPTION, close → POLL_CLOSED", async () => {
      await expect(
        live.voteLivePoll(pollId, "opt-1", "voter-0")
      ).rejects.toMatchObject({ code: "ALREADY_VOTED" });
      await expect(
        live.voteLivePoll(pollId, "opt-99", "voter-new")
      ).rejects.toMatchObject({ code: "INVALID_OPTION" });

      const closed = await live.closeLivePoll(pollId);
      expect(closed?.active).toBe(0);
      await expect(
        live.voteLivePoll(pollId, "opt-1", "voter-new")
      ).rejects.toMatchObject({ code: "POLL_CLOSED" });
      // Doublon sur sondage fermé : ALREADY_VOTED prime (parité Store).
      await expect(
        live.voteLivePoll(pollId, "opt-1", "voter-0")
      ).rejects.toMatchObject({ code: "ALREADY_VOTED" });
      await expect(
        live.voteLivePoll(999999, "opt-1", "voter-x")
      ).rejects.toMatchObject({ code: "POLL_CLOSED" });

      // Rien n'a été persisté par les votes refusés.
      expect(await live.getPollVotes(pollId)).toHaveLength(10);
      const byId = Object.fromEntries(
        (await live.getPollById(pollId))!.options.map((o) => [o.id, o.votes])
      );
      expect(byId).toEqual({ "opt-1": 5, "opt-2": 5 });
    });

    it("viewer_count : 10 incréments parallèles = +10, id inconnu no-op", async () => {
      const before = (await live.getLiveEventBySlug("assemblee-generale"))!.viewer_count;
      await Promise.all(
        Array.from({ length: 10 }, () => live.incrementViewerCount(eventId))
      );
      await live.incrementViewerCount(999999);
      const after = (await live.getLiveEventBySlug("assemblee-generale"))!.viewer_count;
      expect(after).toBe(before + 10);
    });

    it("updateLiveEventMedia : patch partiel, id inconnu → undefined", async () => {
      const patched = await live.updateLiveEventMedia(eventId, {
        thumbnail: "/uploads/live.jpg",
      });
      expect(patched?.thumbnail).toBe("/uploads/live.jpg");
      const alt = await live.updateLiveEventMedia(eventId, { thumbnail_alt: "Direct CFM" });
      expect(alt?.thumbnail).toBe("/uploads/live.jpg");
      expect(alt?.thumbnail_alt).toBe("Direct CFM");
      expect(await live.updateLiveEventMedia(999999, { thumbnail: "x" })).toBeUndefined();
      expect(await live.updateLiveEvent(999999, { title: "x" })).toBeUndefined();
    });
  });
});
