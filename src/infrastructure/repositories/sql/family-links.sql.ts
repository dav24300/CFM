import "server-only";
import type { FamilyLink } from "@/domain/entities/v2";
import { domainError } from "@/domain/errors/domain-error";
import {
  normalizePgRow,
  normalizePgRows,
} from "@/infrastructure/persistence/normalize-pg-row";
import { mapPgError } from "@/infrastructure/persistence/sql/pg-errors";
import { query, withTransaction } from "@/infrastructure/persistence/sql/sql-client";

/**
 * Agrégat liens familiaux en SQL ciblé (mode PG). Module séparé de
 * users.sql.ts : miroir 1:1 du repository propriétaire
 * (family-links.repository), comme petitions.sql ↔ petitions.repository.
 * Les gardes métier amont (CHILD_NOT_FOUND, PARENT_NOT_FOUND, SELF_LINK,
 * NOT_FAMILY_PARENT) restent dans le repository — communes aux deux modes.
 */

export async function getFamilyLinksForUser(userId: number): Promise<FamilyLink[]> {
  try {
    const res = await query<FamilyLink>(
      "SELECT * FROM family_links WHERE parent_user_id = $1 OR child_user_id = $1 ORDER BY id",
      [userId]
    );
    return normalizePgRows(res.rows);
  } catch (err) {
    mapPgError(err);
  }
}

/**
 * Anti-doublon + insertion en UNE transaction : la ligne users du parent est
 * verrouillée FOR UPDATE pour sérialiser les créations concurrentes du même
 * couple (pas de contrainte unique sur family_links — parité avec la mutation
 * Store qui était sérialisée par le verrou global). Doublon non rejeté →
 * LINK_EXISTS, identique à la branche Store.
 */
export async function createFamilyLink(data: {
  parent_user_id: number;
  child_user_id: number;
  relationship: string;
  status: "pending_child" | "pending_parent";
  initiated_by: "parent" | "child";
}): Promise<FamilyLink> {
  return withTransaction(async (client) => {
    await client.query("SELECT id FROM users WHERE id = $1 FOR UPDATE", [
      data.parent_user_id,
    ]);
    const exists = await client.query(
      `SELECT 1 FROM family_links
       WHERE parent_user_id = $1 AND child_user_id = $2 AND status <> 'rejected'`,
      [data.parent_user_id, data.child_user_id]
    );
    if ((exists.rowCount ?? 0) > 0) throw domainError("LINK_EXISTS");

    const res = await client.query<FamilyLink>(
      `INSERT INTO family_links (parent_user_id, child_user_id, relationship, status, initiated_by, created_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        data.parent_user_id,
        data.child_user_id,
        data.relationship,
        data.status,
        data.initiated_by,
        new Date().toISOString(),
      ]
    );
    return normalizePgRow(res.rows[0]);
  }).catch((err) => mapPgError(err));
}

/**
 * Réponse du destinataire (approve/reject) : lien verrouillé FOR UPDATE,
 * gardes identiques à la branche Store (NOT_FOUND, FORBIDDEN si le répondant
 * n'est pas le destinataire du statut pending courant).
 */
export async function respondFamilyLink(
  linkId: number,
  userId: number,
  approve: boolean
): Promise<void> {
  await withTransaction(async (client) => {
    const res = await client.query<FamilyLink>(
      "SELECT * FROM family_links WHERE id = $1 FOR UPDATE",
      [linkId]
    );
    const link = res.rows[0];
    if (!link) throw domainError("NOT_FOUND");

    if (link.status === "pending_child" && link.child_user_id !== userId) {
      throw domainError("FORBIDDEN");
    }
    if (link.status === "pending_parent" && link.parent_user_id !== userId) {
      throw domainError("FORBIDDEN");
    }

    await client.query("UPDATE family_links SET status = $2 WHERE id = $1", [
      linkId,
      approve ? "approved" : "rejected",
    ]);
  }).catch((err) => mapPgError(err));
}

/** Admin : force le statut ; lien introuvable → no-op (parité Store). */
export async function setFamilyLinkStatus(
  linkId: number,
  status: "approved" | "rejected"
): Promise<void> {
  try {
    await query("UPDATE family_links SET status = $2 WHERE id = $1", [linkId, status]);
  } catch (err) {
    mapPgError(err);
  }
}

/** Ordre id DESC — équivalent du [...store.family_links].reverse() historique. */
export async function getAllFamilyLinks(): Promise<FamilyLink[]> {
  try {
    const res = await query<FamilyLink>("SELECT * FROM family_links ORDER BY id DESC");
    return normalizePgRows(res.rows);
  } catch (err) {
    mapPgError(err);
  }
}

/** Compteurs liens familiaux pour le tableau de bord admin. */
export async function getFamilyLinkCounters(): Promise<{
  total: number;
  pending: number;
}> {
  try {
    const [total, pending] = await Promise.all([
      query<{ n: number }>("SELECT COUNT(*)::int AS n FROM family_links"),
      query<{ n: number }>(
        "SELECT COUNT(*)::int AS n FROM family_links WHERE status NOT IN ('approved', 'rejected')"
      ),
    ]);
    return { total: total.rows[0].n, pending: pending.rows[0].n };
  } catch (err) {
    mapPgError(err);
  }
}
