import {
  getStore,
  updateStore,
  nextId,
} from "@/infrastructure/persistence/store-access";
import type { Donation } from "@/domain/entities/v2";

export function createDonation(data: {
  user_id?: number;
  amount: number;
  currency: string;
  provider: "orange" | "mpesa" | "airtel";
  phone: string;
  donor_name?: string;
  donor_email?: string;
}): Donation {
  let created!: Donation;
  updateStore((store) => {
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

export function completeDonation(
  donationId: number,
  transactionId: string
): Donation | undefined {
  let result: Donation | undefined;
  updateStore((store) => {
    const d = store.donations.find((x) => x.id === donationId);
    if (d) {
      d.status = "completed";
      d.transaction_id = transactionId;
      result = d;
    }
  });
  return result;
}

export function getDonationsForUser(userId: number): Donation[] {
  return getStore().donations.filter((d) => d.user_id === userId);
}

export function getAllDonations(): Donation[] {
  return [...getStore().donations].reverse();
}

export function adminUpdateDonation(
  donationId: number,
  patch: { status?: Donation["status"]; transaction_id?: string | null }
): Donation | undefined {
  let result: Donation | undefined;
  updateStore((store) => {
    const d = store.donations.find((x) => x.id === donationId);
    if (!d) return;
    if (patch.status !== undefined) d.status = patch.status as Donation["status"];
    if (patch.transaction_id !== undefined) d.transaction_id = patch.transaction_id;
    result = d;
  });
  return result;
}
