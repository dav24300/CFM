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
});
