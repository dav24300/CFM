/**
 * Intégration PG — agrégat pétitions en SQL ciblé (C4).
 * Requiert TEST_DATABASE_URL ; base réinitialisée (DROP SCHEMA public CASCADE).
 * Démontre la disparition du lost update : N signatures parallèles = N persistées.
 */
import { describe, expect, it, beforeAll, afterAll } from "vitest";

const TEST_URL = process.env.TEST_DATABASE_URL;

describe.skipIf(!TEST_URL)("petitions.repository en mode PG (intégration)", () => {
  let repo: typeof import("@/infrastructure/repositories/petitions.repository");
  let sqlPetitions: typeof import("@/infrastructure/repositories/sql/petitions.sql");
  let sqlClient: typeof import("@/infrastructure/persistence/sql/sql-client");

  beforeAll(async () => {
    process.env.DATABASE_URL = TEST_URL;
    process.env.CFM_PG_NORMALIZED = "true";

    const pg = await import("pg");
    const admin = new pg.Pool({ connectionString: TEST_URL, connectionTimeoutMillis: 5000 });
    await admin.query("DROP SCHEMA public CASCADE; CREATE SCHEMA public;");
    await admin.end();

    sqlClient = await import("@/infrastructure/persistence/sql/sql-client");
    sqlPetitions = await import("@/infrastructure/repositories/sql/petitions.sql");
    repo = await import("@/infrastructure/repositories/petitions.repository");
    await sqlClient.ensureSchemaOnce();
  });

  afterAll(async () => {
    await sqlClient.closePoolForTests();
  });

  it("createPetition : id de séquence, slug généré, retour normalisé", async () => {
    const petition = await repo.createPetition({
      title: "Pétition Test C4 — Éducation",
      description: "desc",
      goal: 500,
    });
    expect(petition.id).toBeGreaterThan(100); // séquence, seuil ≥ 100
    expect(petition.slug).toBe("petition-test-c4--education"); // slugify identique à la branche Store
    expect(petition.signatures_count).toBe(0);
    expect(petition.active).toBe(1);
    expect(typeof petition.created_at).toBe("string");
    const found = await repo.getPetitionById(petition.id);
    expect(found?.title).toBe("Pétition Test C4 — Éducation");
  });

  it("signPetition : insère + incrémente signatures_count", async () => {
    const p = await repo.createPetition({ title: "Sign C4", description: "d", goal: 100 });
    await repo.signPetition({ petition_id: p.id, email: "Sig.One@Ex.com ", name: "S1" });
    const sigs = await repo.getPetitionSignatures(p.id);
    expect(sigs).toHaveLength(1);
    expect(sigs[0].email).toBe("sig.one@ex.com"); // trim + lowercase
    const after = await repo.getPetitionById(p.id);
    expect(after?.signatures_count).toBe(1);
  });

  it("doublon (casse différente) → ALREADY_SIGNED via contrainte unique", async () => {
    const p = await repo.createPetition({ title: "Dup C4", description: "d", goal: 100 });
    await repo.signPetition({ petition_id: p.id, email: "dup@ex.com", name: "A" });
    await expect(
      repo.signPetition({ petition_id: p.id, email: "DUP@EX.COM", name: "B" })
    ).rejects.toMatchObject({ code: "ALREADY_SIGNED" });
  });

  it("10 signatures parallèles : 10/10 persistées (plus de lost update)", async () => {
    const p = await repo.createPetition({ title: "Concurrence C4", description: "d", goal: 100 });
    const emails = Array.from({ length: 10 }, (_, i) => `c${i}@conc.ex`);
    await Promise.all(
      emails.map((email) => repo.signPetition({ petition_id: p.id, email, name: email }))
    );
    const sigs = await repo.getPetitionSignatures(p.id);
    expect(sigs).toHaveLength(10);
    const after = await repo.getPetitionById(p.id);
    expect(after?.signatures_count).toBe(10);
  });

  it("pétition inactive → NOT_FOUND à la signature", async () => {
    const p = await repo.createPetition({ title: "Inactive C4", description: "d", goal: 100 });
    expect(await repo.updatePetition(p.id, { active: 0 })).toBe(true);
    await expect(
      repo.signPetition({ petition_id: p.id, email: "x@ex.com", name: "X" })
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(await repo.getPetitionBySlug(p.slug)).toBeUndefined(); // slug actif uniquement
  });

  it("deletePetition : cascade sur les signatures", async () => {
    const p = await repo.createPetition({ title: "Delete C4", description: "d", goal: 100 });
    await repo.signPetition({ petition_id: p.id, email: "del@ex.com", name: "D" });
    expect(await repo.deletePetition(p.id)).toBe(true);
    const res = await sqlClient.query<{ n: number }>(
      "SELECT COUNT(*)::int AS n FROM petition_signatures WHERE petition_id = $1",
      [p.id]
    );
    expect(res.rows[0].n).toBe(0);
    expect(await repo.deletePetition(p.id)).toBe(false);
  });

  it("seedDefaultPetitionsIfEmpty : seede si vide, idempotent sinon", async () => {
    await sqlClient.query("DELETE FROM petition_signatures");
    await sqlClient.query("DELETE FROM petitions");
    await sqlPetitions.seedDefaultPetitionsIfEmpty();
    const first = await sqlClient.query<{ n: number }>("SELECT COUNT(*)::int AS n FROM petitions");
    expect(first.rows[0].n).toBe(2);
    await sqlPetitions.seedDefaultPetitionsIfEmpty();
    const second = await sqlClient.query<{ n: number }>("SELECT COUNT(*)::int AS n FROM petitions");
    expect(second.rows[0].n).toBe(2);
  });
});
