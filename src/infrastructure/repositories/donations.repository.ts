import {
  getStoreAsync,
  updateStoreAsync,
  nextId,
} from "@/infrastructure/persistence/store-access";
import { isPgMode } from "@/infrastructure/persistence/sql/sql-client";
import * as sqlDonations from "@/infrastructure/repositories/sql/donations.sql";
import type { Donation } from "@/domain/entities/v2";

/**
 * Agrégat dons — dual-mode :
 * - PG (DATABASE_URL) : SQL ciblé (sql/donations.sql.ts), amount DECIMAL
 *   converti en number à la lecture (parité domaine/Store).
 * - JSON (dev) : branche Store historique inchangée.
 */

export async function createDonation(data: {
  user_id?: number;
  amount: number;
  currency: string;
  provider: "orange" | "mpesa" | "airtel";
  phone: string;
  donor_name?: string;
  donor_email?: string;
}): Promise<Donation> {
  if (isPgMode()) return sqlDonations.createDonation(data);
  let created!: Donation;
  await updateStoreAsync((store) => {
    created = {
      id: nextId(store),
      user_id: data.user_id || null,
      amount: data.amount,
      currency: data.currency,
      provider: data.provider,
      phone: data.phone,
      transaction_id: null,
      status: "pending",
      donor_name: data.donor_name || null,
      donor_email: data.donor_email || null,
      created_at: new Date().toISOString(),
    };
    store.donations.push(created);
  });
  return created!;
}

export async function completeDonation(
  donationId: number,
  transactionId: string
): Promise<Donation | undefined> {
  if (isPgMode()) return sqlDonations.completeDonation(donationId, transactionId);
  let result: Donation | undefined;
  await updateStoreAsync((store) => {
    const d = store.donations.find((x) => x.id === donationId);
    if (d) {
      d.status = "completed";
      d.transaction_id = transactionId;
      result = d;
    }
  });
  return result;
}

export async function getDonationsForUser(userId: number): Promise<Donation[]> {
  if (isPgMode()) return sqlDonations.getDonationsForUser(userId);
  const store = await getStoreAsync();
  return store.donations.filter((d) => d.user_id === userId);
}

export async function getAllDonations(): Promise<Donation[]> {
  if (isPgMode()) return sqlDonations.getAllDonations();
  const store = await getStoreAsync();
  return [...store.donations].reverse();
}

/** Dates de création (created_at brutes) de tous les dons. */
export async function listDonationCreationDates(): Promise<string[]> {
  if (isPgMode()) return sqlDonations.listDonationCreationDates();
  const store = await getStoreAsync();
  return store.donations.map((d) => d.created_at);
}

/** Nombre total de dons enregistrés. */
export async function countDonations(): Promise<number> {
  if (isPgMode()) return sqlDonations.countDonations();
  const store = await getStoreAsync();
  return (store.donations || []).length;
}

export async function adminUpdateDonation(
  donationId: number,
  patch: { status?: Donation["status"]; transaction_id?: string | null }
): Promise<Donation | undefined> {
  if (isPgMode()) return sqlDonations.adminUpdateDonation(donationId, patch);
  let result: Donation | undefined;
  await updateStoreAsync((store) => {
    const d = store.donations.find((x) => x.id === donationId);
    if (!d) return;
    if (patch.status !== undefined) d.status = patch.status as Donation["status"];
    if (patch.transaction_id !== undefined) d.transaction_id = patch.transaction_id;
    result = d;
  });
  return result;
}
