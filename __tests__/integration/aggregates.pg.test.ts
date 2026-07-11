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
});
