import {
  createDonation,
  completeDonation,
  getAllDonations,
} from "@/infrastructure/repositories/donations.repository";
import { getCurrentMember } from "@/infrastructure/auth/member-auth";
import { createPayDunyaInvoice } from "@/infrastructure/payment/paydunya.adapter";
import { sendDonationReceiptEmail } from "@/infrastructure/email/nodemailer.adapter";
import type { Donation } from "@/domain/entities/v2";

export type DonationResult =
  | {
      mode: "demo";
      donation: Donation | undefined;
      message: string;
    }
  | {
      mode: "production";
      donation: Donation;
      paymentUrl: string;
    };

export async function processDonation(body: {
  amount: number;
  currency?: string;
  provider: "orange" | "mpesa" | "airtel";
  phone: string;
  donor_name?: string;
  donor_email?: string;
}): Promise<DonationResult> {
  const member = await getCurrentMember();
  const donation = await createDonation({
    user_id: member?.id,
    amount: parseFloat(String(body.amount)),
    currency: body.currency || "USD",
    provider: body.provider,
    phone: body.phone,
    donor_name: body.donor_name,
    donor_email: body.donor_email || member?.email,
  });

  const isDemo = process.env.MOBILE_MONEY_MODE !== "production";

  if (isDemo) {
    const completed = await completeDonation(
      donation.id,
      `DEMO-${Date.now()}-${donation.id}`
    );
    if (completed?.donor_email) {
      await sendDonationReceiptEmail({
        to: completed.donor_email,
        donorName: completed.donor_name || "Donateur",
        amount: completed.amount,
        currency: completed.currency,
        provider: completed.provider,
        transactionId: completed.transaction_id || "",
      });
    }
    return {
      mode: "demo",
      donation: completed,
      message:
        "Paiement simulé avec succès. Un reçu a été envoyé par email si configuré.",
    };
  }

  const paydunya = await createPayDunyaInvoice({
    amount: donation.amount,
    currency: donation.currency,
    description: `Don ${donation.provider.toUpperCase()} — CFM ASBL`,
    donationId: donation.id,
  });

  if (!paydunya.success || !paydunya.invoice_url) {
    throw new Error(paydunya.error || "PAYDUNYA_ERROR");
  }

  return {
    mode: "production",
    donation,
    paymentUrl: paydunya.invoice_url,
  };
}

export async function handleDonationWebhook(
  donationId: number,
  transactionId: string
): Promise<Donation | undefined> {
  const completed = await completeDonation(donationId, transactionId);
  if (completed?.donor_email) {
    await sendDonationReceiptEmail({
      to: completed.donor_email,
      donorName: completed.donor_name || "Donateur",
      amount: completed.amount,
      currency: completed.currency,
      provider: completed.provider,
      transactionId: completed.transaction_id || "",
    });
  }
  return completed;
}

export { getAllDonations, completeDonation };
