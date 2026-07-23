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

  describe("portail (C11)", () => {
    let events: typeof import("@/infrastructure/repositories/events.repository");
    let messages: typeof import("@/infrastructure/repositories/messages.repository");
    let resources: typeof import("@/infrastructure/repositories/resources.repository");

    beforeAll(async () => {
      events = await import("@/infrastructure/repositories/events.repository");
      messages = await import("@/infrastructure/repositories/messages.repository");
      resources = await import("@/infrastructure/repositories/resources.repository");
    });

    it("seed hook : 3 events (dates futures) + 4 ressources, idempotent", async () => {
      const hooks = await import("@/infrastructure/persistence/sql/seed-hooks");
      await hooks.seedMigratedAggregates();
      await hooks.seedMigratedAggregates();
      const evCount = await sqlClient.query<{ n: number }>(
        "SELECT COUNT(*)::int AS n FROM events"
      );
      expect(evCount.rows[0].n).toBe(3);
      const resCount = await sqlClient.query<{ n: number }>(
        "SELECT COUNT(*)::int AS n FROM member_resources"
      );
      expect(resCount.rows[0].n).toBe(4);

      const all = await events.getAllEvents();
      const today = new Date().toISOString().slice(0, 10);
      expect(all).toHaveLength(3);
      expect(all.every((e) => e.date > today)).toBe(true);
      expect(all.every((e) => e.rsvp_user_ids.length === 0)).toBe(true);
      // Seedés à +21/+38/+60 jours → tous "à venir".
      expect(await events.getUpcomingEvents()).toHaveLength(3);

      const atelier = all.find((e) => e.title === "Atelier entrepreneuriat pour veuves");
      expect(atelier).toMatchObject({
        province: "Nord-Kivu",
        time: "09:00",
        type: "atelier",
        capacity: 40,
      });
      expect(atelier!.id).toBeGreaterThan(100);
      expect(typeof atelier!.created_at).toBe("string");
    });

    it("tri des events : date + heure croissantes, heure vide = 00:00, filtre à venir, province", async () => {
      const now = new Date().toISOString();
      const d5 = new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10);
      await sqlClient.query(
        `INSERT INTO events (title, description, province, "date", "time", type, location, capacity, rsvp_user_ids, created_at)
         VALUES
           ('Passé', 'd', 'Kinshasa', '2000-01-01', '10:00', 'rencontre', 'Kin', NULL, '[]'::jsonb, $1),
           ('Matin', 'd', 'Kinshasa', $2, '08:00', 'atelier', 'Kin', 20, '[]'::jsonb, $1),
           ('Aube', 'd', 'Ituri', $2, '', 'atelier', 'Bunia', NULL, '[]'::jsonb, $1)`,
        [now, d5]
      );

      // getAllEvents inclut le passé ; même date → l'heure vide (00:00) passe en premier.
      const all = await events.getAllEvents();
      expect(all).toHaveLength(6);
      expect(all.map((e) => e.title).slice(0, 3)).toEqual(["Passé", "Aube", "Matin"]);

      const upcoming = await events.getUpcomingEvents();
      expect(upcoming.map((e) => e.title)).toEqual([
        "Aube",
        "Matin",
        "Atelier entrepreneuriat pour veuves",
        "Rencontre des familles militaires — Kinshasa",
        "Distribution de kits scolaires",
      ]);

      const kin = await events.getEventsForProvince("Kinshasa");
      expect(kin.map((e) => e.title)).toEqual([
        "Passé",
        "Matin",
        "Rencontre des familles militaires — Kinshasa",
      ]);

      // listPortalEvents : ordre d'insertion (id ASC), champs normalisés.
      const list = await events.listPortalEvents();
      expect(list).toHaveLength(6);
      expect(list.map((e) => e.id)).toEqual(
        [...list.map((e) => e.id)].sort((a, b) => a - b)
      );
      const matin = list.find((e) => e.title === "Matin")!;
      expect(matin.date).toBe(d5);
      expect(matin.time).toBe("08:00");
      expect(matin.capacity).toBe(20);
      expect(matin.rsvp_user_ids).toEqual([]);
    });

    it("rsvp : bascule aller/retour persistée, id inconnu → undefined", async () => {
      // event_rsvps référence users(id) : les inscrits doivent exister.
      await sqlClient.query(
        `INSERT INTO users (id, email, password_hash, first_name, last_name, phone, role, membership_type, status, created_at)
         VALUES (777, 'rsvp777@x.cd', 'h', 'R', 'S', '+243', 'member', 'soutien', 'active', NOW())
         ON CONFLICT DO NOTHING`
      );
      const target = (await events.getUpcomingEvents(777))[0]; // "Aube"

      const on = await events.rsvpEvent(target.id, 777);
      expect(on).toMatchObject({ going: true, count: 1 });

      // Relecture : persisté, et l'état est celui du membre qui consulte.
      let again = (await events.getUpcomingEvents(777))[0];
      expect(again.rsvp_count).toBe(1);
      expect(again.viewer_going).toBe(true);

      // Un autre membre ne se voit pas inscrit et n'obtient aucune liste.
      const autre = (await events.getUpcomingEvents(1234))[0];
      expect(autre.viewer_going).toBe(false);
      expect(autre.rsvp_user_ids).toEqual([]);

      const off = await events.rsvpEvent(target.id, 777);
      expect(off).toMatchObject({ going: false, count: 0 });
      again = (await events.getUpcomingEvents(777))[0];
      expect(again.rsvp_count).toBe(0);

      expect(await events.rsvpEvent(999999, 777)).toBeUndefined();
    });

    it("rsvp : la capacité est respectée sous inscriptions simultanées", async () => {
      await sqlClient.query(
        `INSERT INTO users (id, email, password_hash, first_name, last_name, phone, role, membership_type, status, created_at)
         SELECT g, 'cap'||g||'@x.cd', 'h', 'C', 'A', '+243', 'member', 'soutien', 'active', NOW()
         FROM generate_series(2000, 2019) g ON CONFLICT DO NOTHING`
      );
      await sqlClient.query(
        `INSERT INTO events (id, title, province, "date", "time", type, location, capacity, rsvp_user_ids, created_at)
         VALUES (9100, 'Plafonné', 'Kinshasa', '2030-06-01', '09:00', 'atelier', 'Salle', 5, '[]'::jsonb, NOW())
         ON CONFLICT DO NOTHING`
      );

      // 20 candidats simultanés pour 5 places : la limite doit tenir.
      const res = await Promise.all(
        Array.from({ length: 20 }, (_, i) => events.rsvpEvent(9100, 2000 + i))
      );
      const admis = res.filter((r) => r?.going).length;
      const refuses = res.filter((r) => r?.full).length;

      const total = await sqlClient.query<{ n: number }>(
        "SELECT count(*)::int AS n FROM event_rsvps WHERE event_id = 9100"
      );
      expect(total.rows[0].n).toBe(5);
      expect(admis).toBe(5);
      expect(refuses).toBe(15);
    });

    it("rsvp : 10 inscriptions parallèles de membres distincts → 10 inscrits", async () => {
      await sqlClient.query(
        `INSERT INTO users (id, email, password_hash, first_name, last_name, phone, role, membership_type, status, created_at)
         SELECT g, 'p'||g||'@x.cd', 'h', 'P', 'A', '+243', 'member', 'soutien', 'active', NOW()
         FROM generate_series(1000, 1009) g ON CONFLICT DO NOTHING`
      );
      const target = (await events.getUpcomingEvents())[0];
      const res = await Promise.all(
        Array.from({ length: 10 }, (_, i) => events.rsvpEvent(target.id, 1000 + i))
      );
      expect(res.every((r) => r?.going)).toBe(true);

      const after = (await events.getUpcomingEvents())[0];
      expect(after.rsvp_count).toBe(10);
      const lignes = await sqlClient.query(
        "SELECT count(*)::int AS n FROM event_rsvps WHERE event_id = $1",
        [target.id]
      );
      expect(lignes.rows[0].n).toBe(10);
    });

    it("messages : envoi + accusé auto, fil chronologique par user, marquage lu", async () => {
      const sent = await messages.sendMemberMessage(501, {
        subject: "  Aide  ",
        body: "Bonjour CFM",
      });
      expect(sent.id).toBeGreaterThan(100);
      expect(sent.direction).toBe("out");
      expect(sent.author_name).toBe("Vous");
      expect(sent.subject).toBe("Aide"); // trim
      expect(sent.body).toBe("Bonjour CFM");
      expect(sent.read).toBe(1);
      expect(typeof sent.created_at).toBe("string");

      await messages.sendMemberMessage(502, { body: "Autre membre" });

      const mine = await messages.getMessagesForUser(501);
      expect(mine).toHaveLength(2); // message + accusé de réception
      expect(mine[0].id).toBe(sent.id);
      expect(mine[1]).toMatchObject({
        user_id: 501,
        direction: "in",
        author_name: "Référent CFM",
        subject: null,
        read: 0,
      });
      // Accusé 1 ms après : ordre chronologique garanti.
      expect(mine[0].created_at.localeCompare(mine[1].created_at)).toBeLessThan(0);

      await messages.markMessagesRead(501);
      const after = await messages.getMessagesForUser(501);
      expect(after.every((m) => m.read === 1)).toBe(true);

      // L'autre membre n'est pas affecté ; subject omis → null.
      const other = await messages.getMessagesForUser(502);
      expect(other).toHaveLength(2);
      expect(other[0].subject).toBeNull();
      expect(other.find((m) => m.direction === "in")?.read).toBe(0);

      expect(await messages.getMessagesForUser(999999)).toEqual([]);
    });

    it("ressources : liste id DESC, groupement par catégorie, catégorie vide → Autre", async () => {
      await sqlClient.query(
        `INSERT INTO member_resources (title, category, description, file_url, external_url, created_at)
         VALUES ('Sans catégorie', NULL, 'd', NULL, 'https://ex.cd/doc', $1)`,
        [new Date().toISOString()]
      );

      const all = await resources.getAllResources();
      expect(all).toHaveLength(5);
      expect(all[0].title).toBe("Sans catégorie"); // plus récente d'abord
      expect(all[4].title).toBe("Obtenir une pension de survie");
      expect(all.map((r) => r.id)).toEqual(
        [...all.map((r) => r.id)].sort((a, b) => b - a)
      );

      const grouped = await resources.getResourcesByCategory();
      expect(Object.keys(grouped)).toEqual([
        "Démarches",
        "Éducation",
        "Santé",
        "Juridique",
        "Autre",
      ]);
      expect(grouped["Santé"].map((r) => r.title)).toEqual([
        "Accès aux soins de santé reproductive",
      ]);
      expect(grouped["Autre"]).toHaveLength(1);
      expect(grouped["Autre"][0]).toMatchObject({
        title: "Sans catégorie",
        file_url: null,
        external_url: "https://ex.cd/doc",
      });
    });
  });

  describe("contenu (C12a)", () => {
    let sqlContent: typeof import("@/infrastructure/repositories/sql/content.sql");
    let partnersRepo: typeof import("@/infrastructure/repositories/partners.repository");
    let newsId: number;
    let oldNewsId: number;
    let draftNewsId: number;

    beforeAll(async () => {
      sqlContent = await import("@/infrastructure/repositories/sql/content.sql");
      partnersRepo = await import("@/infrastructure/repositories/partners.repository");
    });

    it("adminCreate news : id séquence, slug auto (slugify), défauts published=1 / category actualite", async () => {
      await content.adminCreate("news", {
        title: "Première Édition Spéciale",
        content: "Corps de l'article",
      });
      const res = await sqlClient.query<{
        id: number;
        slug: string;
        excerpt: string | null;
        category: string;
        published: number;
        created_at: Date;
      }>("SELECT * FROM news ORDER BY id");
      expect(res.rows).toHaveLength(1);
      newsId = res.rows[0].id;
      expect(newsId).toBeGreaterThan(100);
      expect(res.rows[0].slug).toBe("premiere-edition-speciale");
      expect(res.rows[0].excerpt).toBeNull();
      expect(res.rows[0].category).toBe("actualite");
      expect(res.rows[0].published).toBe(1);
      expect(res.rows[0].created_at).toBeTruthy();
    });

    it("doublon de slug news → idx_news_slug lève PERSISTENCE_ERROR (écart assumé : la branche Store insérait silencieusement)", async () => {
      await expect(
        content.adminCreate("news", {
          title: "Doublon",
          slug: "premiere-edition-speciale",
          content: "x",
        })
      ).rejects.toMatchObject({ code: "PERSISTENCE_ERROR" });
      // Rien n'a été inséré, et idem côté studies (idx_studies_slug).
      const n = await sqlClient.query<{ n: number }>("SELECT COUNT(*)::int AS n FROM news");
      expect(n.rows[0].n).toBe(1);

      await content.adminCreate("studies", { title: "Étude Alpha", content: "Corps" });
      await expect(
        content.adminCreate("studies", { title: "Étude Alpha", content: "Doublon" })
      ).rejects.toMatchObject({ code: "PERSISTENCE_ERROR" });
    });

    it("adminCreate : table inconnue = no-op silencieux (parité Store)", async () => {
      await content.adminCreate("pg_tables_inconnue", { title: "x", content: "y" });
      // Aucune erreur ; rien d'inséré nulle part.
      const n = await sqlClient.query<{ n: number }>("SELECT COUNT(*)::int AS n FROM news");
      expect(n.rows[0].n).toBe(1);
    });

    it("updateNewsItem / adminUpdateContent : patch partiel, normalisations, id inconnu → false", async () => {
      // Deux actualités supplémentaires pour les tris.
      await content.adminCreate("news", { title: "Ancienne actu", content: "Corps ancien" });
      await content.adminCreate("news", { title: "Brouillon", content: "Non publié" });
      const rows = await sqlClient.query<{ id: number; slug: string }>(
        "SELECT id, slug FROM news ORDER BY id"
      );
      oldNewsId = rows.rows[1].id;
      draftNewsId = rows.rows[2].id;

      // Dates contrôlées pour vérifier le tri DESC (via adminUpdateContent).
      expect(
        await content.adminUpdateContent("news", newsId, { created_at: "2026-03-01T00:00:00.000Z" })
      ).toBe(true);
      expect(
        await content.adminUpdateContent("news", oldNewsId, { created_at: "2026-01-01T00:00:00.000Z" })
      ).toBe(true);
      expect(
        await content.adminUpdateContent("news", draftNewsId, { created_at: "2026-05-01T00:00:00.000Z" })
      ).toBe(true);

      // updateNewsItem : excerpt "" → null, category "" → "actualite", dépublication.
      expect(
        await content.updateNewsItem(draftNewsId, { published: 0, excerpt: "", category: "" })
      ).toBe(true);
      const draft = await sqlClient.query<{
        published: number;
        excerpt: string | null;
        category: string;
      }>("SELECT published, excerpt, category FROM news WHERE id = $1", [draftNewsId]);
      expect(draft.rows[0]).toEqual({ published: 0, excerpt: null, category: "actualite" });

      expect(await content.updateNewsItem(999999, { title: "x" })).toBe(false);
      expect(await content.adminUpdateContent("news", 999999, { title: "x" })).toBe(false);
      expect(await content.adminUpdateContent("table_inconnue", newsId, { title: "x" })).toBe(false);

      // Patch appliqué et persistant.
      expect(await content.updateNewsItem(oldNewsId, { title: "Ancienne actu (modifiée)" })).toBe(true);
      const updated = await sqlClient.query<{ title: string }>(
        "SELECT title FROM news WHERE id = $1",
        [oldNewsId]
      );
      expect(updated.rows[0].title).toBe("Ancienne actu (modifiée)");
    });

    it("tris publics : published=0 exclu, created_at DESC, created_at normalisé en ISO", async () => {
      const news = await content.getPublishedNewsAsync();
      expect(news.map((n) => n.id)).toEqual([newsId, oldNewsId]); // 2026-03 avant 2026-01, brouillon exclu
      expect(news.every((n) => typeof n.created_at === "string")).toBe(true);

      const studies = await content.getPublishedStudiesAsync();
      expect(studies).toHaveLength(1);
      expect(studies[0].slug).toBe("etude-alpha");
    });

    it("campaigns : description retombe sur content, active=1, désactivation exclut de la liste publique", async () => {
      await content.adminCreate("campaigns", { title: "Campagne Un", content: "Contenu campagne" });
      await content.adminCreate("campaigns", { title: "Campagne Deux", description: "Desc" });
      const rows = await sqlClient.query<{
        id: number;
        description: string | null;
        active: number;
      }>("SELECT id, description, active FROM campaigns ORDER BY id");
      expect(rows.rows[0].description).toBe("Contenu campagne"); // fallback description || content
      expect(rows.rows.every((c) => c.active === 1)).toBe(true);

      expect(await content.adminUpdateContent("campaigns", rows.rows[1].id, { active: 0 })).toBe(true);
      const active = await content.getActiveCampaignsAsync();
      expect(active.map((c) => c.id)).toEqual([rows.rows[0].id]);
    });

    it("testimonials : anonymous \"1\" → 1, absent → 0, published=1", async () => {
      await content.adminCreate("testimonials", { content: "Témoignage anonyme", anonymous: "1" });
      await content.adminCreate("testimonials", { content: "Témoignage signé", author: "Awa" });
      const rows = await sqlClient.query<{
        author: string | null;
        anonymous: number;
        published: number;
      }>("SELECT author, anonymous, published FROM testimonials ORDER BY id");
      expect(rows.rows[0]).toEqual({ author: null, anonymous: 1, published: 1 });
      expect(rows.rows[1]).toEqual({ author: "Awa", anonymous: 0, published: 1 });
      expect(await content.getPublishedTestimonialsAsync()).toHaveLength(2);
    });

    it("actions : tri date DESC avec null en dernier, date normalisée YYYY-MM-DD", async () => {
      await content.adminCreate("actions", {
        province: "Kinshasa",
        title: "Février",
        date: "2026-02-01",
      });
      await content.adminCreate("actions", {
        province: "Goma",
        title: "Avril",
        date: "2026-04-01",
        type: "distribution",
      });
      await content.adminCreate("actions", { province: "Ituri", title: "Sans date" });

      const actions = await content.getActionsAsync();
      expect(actions.map((a) => a.title)).toEqual(["Avril", "Février", "Sans date"]);
      expect(actions[0].date).toBe("2026-04-01"); // DATE pg → chaîne YYYY-MM-DD
      expect(actions[0].type).toBe("distribution");
      expect(actions[1].type).toBe("action"); // défaut
      expect(actions[2].date).toBeNull();
    });

    it("press_releases : création + liste publique", async () => {
      await content.adminCreate("press_releases", { title: "Communiqué Un", content: "CP" });
      const press = await content.getPublishedPressReleasesAsync();
      expect(press).toHaveLength(1);
      expect(press[0].slug).toBe("communique-un");
      expect(press[0].file_url).toBeNull();
    });

    it("adminDelete : suppression + id/table inconnus no-op, compteurs admin", async () => {
      await content.adminCreate("news", { title: "À supprimer", content: "x" });
      const before = await sqlClient.query<{ n: number }>("SELECT COUNT(*)::int AS n FROM news");
      expect(before.rows[0].n).toBe(4);
      const target = await sqlClient.query<{ id: number }>(
        "SELECT id FROM news WHERE slug = 'a-supprimer'"
      );
      await content.adminDelete("news", target.rows[0].id);
      await content.adminDelete("news", 999999); // no-op silencieux
      await content.adminDelete("table_inconnue", newsId); // table hors whitelist : no-op
      const after = await sqlClient.query<{ n: number }>("SELECT COUNT(*)::int AS n FROM news");
      expect(after.rows[0].n).toBe(3);

      const counters = await sqlContent.getContentAdminCounters();
      expect(counters).toEqual({ news: 3, studies: 1, campaigns: 2 });
    });

    it("getAdminData : listes contenu id DESC (brouillons inclus), actions triées par date", async () => {
      const data = await content.getAdminData();
      expect(data.news.map((n) => n.id)).toEqual([draftNewsId, oldNewsId, newsId]);
      expect(data.studies).toHaveLength(1);
      expect(data.campaigns.map((c) => c.id)).toEqual(
        [...data.campaigns.map((c) => c.id)].sort((a, b) => b - a)
      );
      expect(data.testimonials).toHaveLength(2);
      expect(data.press_releases).toHaveLength(1);
      expect(data.actions.map((a) => a.title)).toEqual(["Avril", "Février", "Sans date"]);
    });

    it("partners : CRUD + sort_order (défaut COUNT+1, 0 explicite conservé, tri stable)", async () => {
      const p1 = await partnersRepo.adminCreatePartner({ name: "Partenaire Un" });
      expect(p1.id).toBeGreaterThan(100);
      expect(p1.sort_order).toBe(1); // défaut = COUNT(*) + 1
      expect(p1.logo_url).toBeNull();

      const p2 = await partnersRepo.adminCreatePartner({
        name: "Partenaire Zéro",
        sort_order: 0,
        website: "https://ex.cd",
      });
      expect(p2.sort_order).toBe(0); // ?? : 0 explicite conservé

      const sorted = await partnersRepo.getAllPartners();
      expect(sorted.map((p) => p.name)).toEqual(["Partenaire Zéro", "Partenaire Un"]);

      expect(
        await partnersRepo.adminUpdatePartner(p1.id, { logo_url: "/uploads/p1.png", sort_order: -1 })
      ).toBe(true);
      expect(await partnersRepo.adminUpdatePartner(999999, { name: "x" })).toBe(false);
      const resorted = await partnersRepo.getAllPartners();
      expect(resorted.map((p) => p.name)).toEqual(["Partenaire Un", "Partenaire Zéro"]);
      expect(resorted[0].logo_url).toBe("/uploads/p1.png");

      await partnersRepo.adminDeletePartner(p2.id);
      await partnersRepo.adminDeletePartner(999999); // no-op silencieux
      const remaining = await partnersRepo.getAllPartners();
      expect(remaining.map((p) => p.id)).toEqual([p1.id]);
    });
  });

  describe("site_settings (C12b)", () => {
    let settings: typeof import("@/infrastructure/repositories/settings.repository");
    let media: typeof import("@/infrastructure/media/media.repository");

    beforeAll(async () => {
      settings = await import("@/infrastructure/repositories/settings.repository");
      media = await import("@/infrastructure/media/media.repository");
    });

    it("patch : upsert de nouvelles clés, merge sans suppression, patch vide no-op", async () => {
      await settings.patchSiteSettings({ site_name: "CFM Intégration", site_sigle: "CFM" });
      await settings.patchSiteSettings({ site_name: "CFM Intégration v2" });
      // La clé non patchée n'est jamais supprimée (merge, pas de prune).
      expect(await settings.getSiteSetting("site_name")).toBe("CFM Intégration v2");
      expect(await settings.getSiteSetting("site_sigle")).toBe("CFM");
      expect(await settings.getSiteSetting("clef_inconnue")).toBeUndefined();

      await settings.patchSiteSettings({}); // no-op silencieux
      const all = await settings.getSiteSettings();
      expect(all.site_name).toBe("CFM Intégration v2");
      expect(all.site_sigle).toBe("CFM");
    });

    it("mutateSiteSetting : clé absente → mutateFn(undefined), puis RMW sur la valeur courante", async () => {
      let seen: string | undefined = "sentinelle";
      await settings.mutateSiteSetting("c12b_rmw", (cur) => {
        seen = cur;
        return "v1";
      });
      expect(seen).toBeUndefined(); // parité Store : clé inexistante
      expect(await settings.getSiteSetting("c12b_rmw")).toBe("v1");

      await settings.mutateSiteSetting("c12b_rmw", (cur) => `${cur}+v2`);
      expect(await settings.getSiteSetting("c12b_rmw")).toBe("v1+v2");
    });

    it("catalogue média : 2 mutations parallèles sur clé absente → les deux appliquées", async () => {
      expect(await settings.getSiteSetting("media_catalog")).toBeUndefined();
      await Promise.all([
        media.addToCatalog({ path: "/media/uploads/c12b-a.webp", category: "upload" }),
        media.addToCatalog({ path: "/media/uploads/c12b-b.webp", category: "upload" }),
      ]);
      const catalog = JSON.parse((await settings.getSiteSetting("media_catalog"))!) as {
        path: string;
        uploaded_at?: string;
      }[];
      expect(catalog.map((c) => c.path).sort()).toEqual([
        "/media/uploads/c12b-a.webp",
        "/media/uploads/c12b-b.webp",
      ]);
      expect(catalog.every((c) => Boolean(c.uploaded_at))).toBe(true);
    });

    it("catalogue média : métadonnées concurrentes + retrait, aucune perte", async () => {
      await Promise.all([
        media.updateCatalogMeta("/media/uploads/c12b-a.webp", { alt: "Visuel A" }),
        media.updateCatalogMeta("/media/uploads/c12b-b.webp", { alt: "Visuel B" }),
      ]);
      const catalog = JSON.parse((await settings.getSiteSetting("media_catalog"))!) as {
        path: string;
        alt?: string;
      }[];
      expect(catalog.find((c) => c.path.endsWith("c12b-a.webp"))?.alt).toBe("Visuel A");
      expect(catalog.find((c) => c.path.endsWith("c12b-b.webp"))?.alt).toBe("Visuel B");

      await media.removeFromCatalog("/media/uploads/c12b-b.webp");
      const after = JSON.parse((await settings.getSiteSetting("media_catalog"))!) as {
        path: string;
      }[];
      expect(after.map((c) => c.path)).toEqual(["/media/uploads/c12b-a.webp"]);
    });

    it("findMediaUsages : croise settings + contenu + partenaires sans lire le Store", async () => {
      const target = "/media/uploads/c12b-usage.webp";
      await media.setSiteSetting("hero_image", target);
      // Une actu du bloc C12a reçoit ce visuel en couverture.
      const news = await content.listAllNews();
      expect(news.length).toBeGreaterThan(0);
      expect(
        await content.adminUpdateContent("news", news[0].id, { cover_image: target })
      ).toBe(true);

      const usages = await media.findMediaUsages(target);
      expect(usages).toContain("site_settings.hero_image");
      expect(usages.some((u) => u.startsWith(`news:${news[0].id} `))).toBe(true);

      // scanMissingMedia parcourt les mêmes agrégats (partners de C12a sans logo exclu ici).
      const missing = await media.scanMissingMedia();
      expect(Array.isArray(missing)).toBe(true);
      expect(missing.every((m) => m.id > 0 && typeof m.field === "string")).toBe(true);
    });
  });
});
