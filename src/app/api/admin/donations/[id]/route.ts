import { NextRequest } from "next/server";
import { adminUpdateDonation } from "@/infrastructure/repositories/donations.repository";
import { requireAdminAccess } from "@/lib/admin-rest";
import { jsonError, jsonNotFound, jsonSuccess } from "@/lib/api-response";
import { logAdminAction } from "@/lib/admin-audit";
import { z } from "@/lib/validators";
import { parseOrBadRequest } from "@/lib/validators";

const patchSchema = z.object({
  status: z.enum(["pending", "completed", "failed"]).optional(),
  transaction_id: z.string().nullable().optional(),
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
  const updated = await adminUpdateDonation(donationId, parsed.data);
  if (!updated) return jsonNotFound("Don introuvable");

  await logAdminAction({
    actorType: auth.access,
    endpoint: "/api/admin/donations/[id]",
    action: "patch",
    target: String(donationId),
    status: "success",
    ip: request.headers.get("x-forwarded-for"),
  });

  return jsonSuccess();
}
