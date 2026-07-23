import "server-only";
import type { Petition, PetitionSignature } from "@/domain/entities/v2";
import { domainError } from "@/domain/errors/domain-error";
import { normalizePgRow, normalizePgRows } from "@/infrastructure/persistence/normalize-pg-row";
import { demoPetitionSeeds, slugify } from "@/infrastructure/persistence/store-seed";
import { mapPgError } from "@/infrastructure/persistence/sql/pg-errors";
import { query, withTransaction } from "@/infrastructure/persistence/sql/sql-client";

/**
 * Agrégat pétitions en SQL ciblé (mode PG).
 * Mêmes signatures et mêmes comportements que la branche Store de
 * petitions.repository ; l'anti-doublon repose sur l'index unique
 * idx_petition_sig_unique (concurrent-safe), plus sur un scan mémoire.
 */

export async function getActivePetitions(): Promise<Petition[]> {
  try {
    const res = await query<Petition>("SELECT * FROM petitions WHERE active = 1 ORDER BY id");
    return normalizePgRows(res.rows);
  } catch (err) {
    mapPgError(err);
  }
}

export async function getAllPetitions(): Promise<Petition[]> {
  try {
    const res = await query<Petition>(
      "SELECT * FROM petitions ORDER BY created_at DESC, id ASC"
    );
    return normalizePgRows(res.rows);
  } catch (err) {
    mapPgError(err);
  }
}

export async function getPetitionBySlug(slug: string): Promise<Petition | undefined> {
  try {
    const res = await query<Petition>(
      "SELECT * FROM petitions WHERE slug = $1 AND active = 1 LIMIT 1",
      [slug]
    );
    return res.rows[0] ? normalizePgRow(res.rows[0]) : undefined;
  } catch (err) {
    mapPgError(err);
  }
}

export async function getPetitionById(id: number): Promise<Petition | undefined> {
  try {
    const res = await query<Petition>("SELECT * FROM petitions WHERE id = $1", [id]);
    return res.rows[0] ? normalizePgRow(res.rows[0]) : undefined;
  } catch (err) {
    mapPgError(err);
  }
}

/**
 * Signe une pétition et renvoie le nouveau total.
 *
 * Une SEULE instruction, sans transaction explicite ni `SELECT ... FOR UPDATE`.
 * L'ancienne version tenait un verrou sur la ligne `petitions` pendant trois
 * allers-retours réseau (SELECT, INSERT, UPDATE) : toutes les signatures
 * concurrentes d'une même pétition étaient sérialisées sur la latence
 * applicative, plafonnant le débit à ~1/RTT. Le verrou était de surcroît
 * inutile — aucun état lu ne servait à calculer l'écriture.
 *
 * Ici, `ins` échoue sur l'index unique en cas de doublon (→ ALREADY_SIGNED) et
 * ne produit aucune ligne si la pétition est absente ou inactive ; l'UPDATE
 * n'incrémente donc que sur insertion réelle, et ne verrouille la ligne que le
 * temps de son propre exécution.
 */
export async function signPetition(data: {
  petition_id: number;
  user_id?: number;
  email: string;
  name: string;
}): Promise<{ signatures_count: number }> {
  try {
    const res = await query<{ signatures_count: number }>(
      `WITH cible AS (
         SELECT id FROM petitions WHERE id = $1::int AND active = 1
       ), ins AS (
         INSERT INTO petition_signatures (petition_id, user_id, email, name, signed_at)
         SELECT cible.id, $2::int, $3::text, $4::text, $5::timestamptz FROM cible
         RETURNING petition_id
       )
       UPDATE petitions p
       SET signatures_count = p.signatures_count + 1
       FROM ins WHERE p.id = ins.petition_id
       RETURNING p.signatures_count`,
      [
        data.petition_id,
        data.user_id ?? null,
        data.email.trim().toLowerCase(),
        data.name,
        new Date().toISOString(),
      ]
    );

    // Aucune ligne : la pétition n'existe pas ou n'est plus active (un doublon
    // aurait levé 23505 en amont).
    if (res.rowCount === 0) throw domainError("NOT_FOUND");
    return { signatures_count: res.rows[0].signatures_count };
  } catch (err) {
    mapPgError(err); // 23505 idx_petition_sig_unique → ALREADY_SIGNED
  }
}

export async function createPetition(data: {
  title: string;
  description: string;
  content?: string;
  goal: number;
}): Promise<Petition> {
  try {
    const res = await query<Petition>(
      `INSERT INTO petitions (title, slug, description, content, goal, signatures_count, active, created_at)
       VALUES ($1, $2, $3, $4, $5, 0, 1, $6)
       RETURNING *`,
      [
        data.title,
        slugify(data.title),
        data.description,
        data.content || null,
        data.goal,
        new Date().toISOString(),
      ]
    );
    return normalizePgRow(res.rows[0]);
  } catch (err) {
    mapPgError(err);
  }
}

export async function updatePetition(
  id: number,
  data: Partial<Pick<Petition, "title" | "slug" | "description" | "content" | "goal" | "active">>
): Promise<boolean> {
  const fields = (
    ["title", "slug", "description", "content", "goal", "active"] as const
  ).filter((k) => data[k] !== undefined);
  try {
    if (fields.length === 0) {
      const res = await query("SELECT 1 FROM petitions WHERE id = $1", [id]);
      return (res.rowCount ?? 0) > 0;
    }
    const sets = fields.map((k, i) => `"${k}" = $${i + 2}`).join(", ");
    const res = await query(
      `UPDATE petitions SET ${sets} WHERE id = $1`,
      [id, ...fields.map((k) => data[k] as unknown)]
    );
    return (res.rowCount ?? 0) > 0;
  } catch (err) {
    mapPgError(err);
  }
}

export async function deletePetition(id: number): Promise<boolean> {
  try {
    // FK petition_signatures ON DELETE CASCADE : signatures supprimées avec.
    const res = await query("DELETE FROM petitions WHERE id = $1", [id]);
    return (res.rowCount ?? 0) > 0;
  } catch (err) {
    mapPgError(err);
  }
}

export async function getPetitionSignatures(petitionId: number): Promise<PetitionSignature[]> {
  try {
    const res = await query<PetitionSignature>(
      "SELECT * FROM petition_signatures WHERE petition_id = $1 ORDER BY id",
      [petitionId]
    );
    return normalizePgRows(res.rows);
  } catch (err) {
    mapPgError(err);
  }
}

/**
 * Seed one-shot des pétitions de démo (table migrée = plus couverte par le
 * sync Store). Appelé uniquement depuis le chemin claimSeedVersion (sérialisé).
 */
export async function seedDefaultPetitionsIfEmpty(): Promise<void> {
  try {
    const count = await query<{ n: number }>("SELECT COUNT(*)::int AS n FROM petitions");
    if (count.rows[0].n > 0) return;
    const now = new Date().toISOString();
    for (const seed of demoPetitionSeeds(now)) {
      await query(
        `INSERT INTO petitions (title, slug, description, content, goal, signatures_count, active, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (slug) DO NOTHING`,
        [seed.title, seed.slug, seed.description, seed.content, seed.goal, seed.signatures_count, seed.active, seed.created_at]
      );
    }
  } catch (err) {
    mapPgError(err);
  }
}

export async function getPetitionAdminCounters(seenAtIso: string): Promise<{
  petitions: number;
  signatures: number;
  newSignatures: number;
}> {
  try {
    const seenAt = Date.parse(seenAtIso);
    const [petitions, signatures, fresh] = await Promise.all([
      query<{ n: number }>("SELECT COUNT(*)::int AS n FROM petitions"),
      query<{ n: number }>("SELECT COUNT(*)::int AS n FROM petition_signatures"),
      Number.isFinite(seenAt)
        ? query<{ n: number }>(
            "SELECT COUNT(*)::int AS n FROM petition_signatures WHERE signed_at > $1::timestamptz",
            [new Date(seenAt).toISOString()]
          )
        : query<{ n: number }>("SELECT COUNT(*)::int AS n FROM petition_signatures"),
    ]);
    return {
      petitions: petitions.rows[0].n,
      signatures: signatures.rows[0].n,
      newSignatures: fresh.rows[0].n,
    };
  } catch (err) {
    mapPgError(err);
  }
}
