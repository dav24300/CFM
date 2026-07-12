import { NextRequest } from "next/server";
import { deleteNewsletterSubscriber } from "@/infrastructure/repositories/content.repository";
import { requireAdminAccess } from "@/lib/admin-rest";
import { getClientIp } from "@/lib/rate-limit";
import { jsonNotFound, jsonSuccess } from "@/lib/api-response";
import { logAdminAction } from "@/lib/admin-audit";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminAccess();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const subscriberId = parseInt(id, 10);
  if (!Number.isFinite(subscriberId)) return jsonNotFound("Abonné introuvable");
  const ok = await deleteNewsletterSubscriber(subscriberId);
  if (!ok) return jsonNotFound("Abonné introuvable");

  await logAdminAction({
    actorType: auth.access,
    endpoint: "/api/admin/newsletter/[id]",
    action: "delete",
    target: String(subscriberId),
    status: "success",
    ip: getClientIp(_request),
  });

  return jsonSuccess();
}
