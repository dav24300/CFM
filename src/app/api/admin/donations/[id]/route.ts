import { NextRequest } from "next/server";
import { adminUpdateDonation } from "@/infrastructure/repositories/donations.repository";
import { sendDonationReceiptEmail } from "@/infrastructure/email/nodemailer.adapter";
import { requireAdminAccess } from "@/lib/admin-rest";
import { getClientIp } from "@/lib/rate-limit";
import { jsonError, jsonNotFound, jsonSuccess } from "@/lib/api-response";
import { logAdminAction } from "@/lib/admin-audit";
import { z } from "@/lib/validators";
import { parseOrBadRequest } from "@/lib/validators";

const patchSchema = z.object({
  status: z.enum(["pending", "completed", "failed"]).optional(),
  transaction_id: z.string().nullable().optional(),
  send_receipt: z.boolean().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminAccess();
  if (!auth.ok) return auth.response;

  const body = await request.json();
  const parsed = parseOrBadRequest(patchSchema, body);
  if (!parsed.ok) return parsed.response;

  const { id } = await params;
  const donationId = parseInt(id, 10);
  if (!Number.isFinite(donationId)) return jsonNotFound("Don introuvable");
  const { send_receipt, ...patch } = parsed.data;
  const updated = await adminUpdateDonation(donationId, patch);
  if (!updated) return jsonNotFound("Don introuvable");

  if (
    updated.status === "completed" &&
    send_receipt !== false &&
    updated.donor_email
  ) {
    try {
      await sendDonationReceiptEmail({
        to: updated.donor_email,
        donorName: updated.donor_name || "Donateur",
        amount: updated.amount,
        currency: updated.currency,
        provider: updated.provider,
        transactionId: updated.transaction_id || `MANUAL-${donationId}`,
      });
    } catch (err) {
      console.error("Receipt email failed:", err);
    }
  }

  await logAdminAction({
    actorType: auth.access,
    endpoint: "/api/admin/donations/[id]",
    action: "patch",
    target: String(donationId),
    status: "success",
    ip: getClientIp(request),
  });

  return jsonSuccess();
}
