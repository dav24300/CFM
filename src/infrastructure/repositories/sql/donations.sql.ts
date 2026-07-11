import "server-only";
import type { Donation } from "@/domain/entities/v2";
import {
  normalizePgRow,
  toIsoString,
} from "@/infrastructure/persistence/normalize-pg-row";
import { mapPgError } from "@/infrastructure/persistence/sql/pg-errors";
import { query } from "@/infrastructure/persistence/sql/sql-client";

/**
 * Agrégat dons en SQL ciblé (mode PG).
 * Mêmes signatures et mêmes comportements que la branche Store de
 * donations.repository.
 *
 * amount : la colonne est DECIMAL(12,2) et pg la retourne en CHAÎNE ("25.00").
 * Le domaine (Donation.amount: number), la branche Store (JSON) et les
 * consommateurs (sommes par reduce de DonationTransparency, reçus email,
 * tableau de bord membre) manipulent un number : chaque lecture convertit
 * donc via Number(row.amount). La baseline de parité
 * (docs/refactor-baseline/api/admin__data.json) a été capturée avec
 * "donations": [] — aucun comportement PG « amount chaîne » n'y est constaté,
 * la conversion en number est donc iso-baseline et évite la concaténation de
 * chaînes latente qu'aurait produit le SELECT * brut de loadStoreFromTables.
 */

function normalizeDonation(row: Donation): Donation {
  const d = normalizePgRow(row);
  return { ...d, amount: Number(d.amount) };
}

export async function createDonation(data: {
  user_id?: number;
  amount: number;
  currency: string;
  provider: "orange" | "mpesa" | "airtel";
  phone: string;
  donor_name?: string;
  donor_email?: string;
}): Promise<Donation> {
  try {
    const res = await query<Donation>(
      `INSERT INTO donations (user_id, amount, currency, provider, phone,
                              transaction_id, status, donor_name, donor_email, created_at)
       VALUES ($1, $2, $3, $4, $5, NULL, 'pending', $6, $7, $8)
       RETURNING *`,
      [
        data.user_id || null,
        data.amount,
        data.currency,
        data.provider,
        data.phone,
        data.donor_name || null,
        data.donor_email || null,
        new Date().toISOString(),
      ]
    );
    return normalizeDonation(res.rows[0]);
  } catch (err) {
    mapPgError(err);
  }
}

export async function completeDonation(
  donationId: number,
  transactionId: string
): Promise<Donation | undefined> {
  try {
    const res = await query<Donation>(
      `UPDATE donations SET status = 'completed', transaction_id = $2
       WHERE id = $1 RETURNING *`,
      [donationId, transactionId]
    );
    return res.rows[0] ? normalizeDonation(res.rows[0]) : undefined;
  } catch (err) {
    mapPgError(err);
  }
}

/** Dons d'un membre, ordre d'insertion — équivalent du filter Store. */
export async function getDonationsForUser(userId: number): Promise<Donation[]> {
  try {
    const res = await query<Donation>(
      "SELECT * FROM donations WHERE user_id = $1 ORDER BY id",
      [userId]
    );
    return res.rows.map(normalizeDonation);
  } catch (err) {
    mapPgError(err);
  }
}

/** Ordre id DESC — équivalent du [...store.donations].reverse() historique. */
export async function getAllDonations(): Promise<Donation[]> {
  try {
    const res = await query<Donation>("SELECT * FROM donations ORDER BY id DESC");
    return res.rows.map(normalizeDonation);
  } catch (err) {
    mapPgError(err);
  }
}

/** Dates de création (created_at) de tous les dons, ordre d'insertion. */
export async function listDonationCreationDates(): Promise<string[]> {
  try {
    const res = await query<{ created_at: unknown }>(
      "SELECT created_at FROM donations ORDER BY id"
    );
    return res.rows.map((r) => toIsoString(r.created_at));
  } catch (err) {
    mapPgError(err);
  }
}

/** Nombre total de dons enregistrés. */
export async function countDonations(): Promise<number> {
  try {
    const res = await query<{ n: number }>("SELECT COUNT(*)::int AS n FROM donations");
    return res.rows[0].n;
  } catch (err) {
    mapPgError(err);
  }
}

/**
 * Parité Store : chaque champ du patch appliqué seulement si !== undefined ;
 * aucun champ fourni → renvoie le don inchangé (comme la mutation Store qui
 * ne modifiait rien) ; id inconnu → undefined.
 */
export async function adminUpdateDonation(
  donationId: number,
  patch: { status?: Donation["status"]; transaction_id?: string | null }
): Promise<Donation | undefined> {
  const sets: string[] = [];
  const params: unknown[] = [donationId];
  const add = (column: string, value: unknown) => {
    params.push(value);
    sets.push(`${column} = $${params.length}`);
  };
  if (patch.status !== undefined) add("status", patch.status);
  if (patch.transaction_id !== undefined) add("transaction_id", patch.transaction_id);

  try {
    const res = sets.length
      ? await query<Donation>(
          `UPDATE donations SET ${sets.join(", ")} WHERE id = $1 RETURNING *`,
          params
        )
      : await query<Donation>("SELECT * FROM donations WHERE id = $1", [donationId]);
    return res.rows[0] ? normalizeDonation(res.rows[0]) : undefined;
  } catch (err) {
    mapPgError(err);
  }
}
