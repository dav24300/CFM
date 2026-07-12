import { NextRequest } from "next/server";
import { requireAdminAccess } from "@/lib/admin-rest";
import { moderateLiveChatMessage } from "@/application/services/live.service";
import { jsonError, jsonSuccess } from "@/infrastructure/http/api-response";

export async function POST(request: NextRequest) {
  const auth = await requireAdminAccess();
  if (!auth.ok) return auth.response;

  const { messageId, status } = await request.json();
  if (!messageId || !["approved", "rejected"].includes(status)) {
    return jsonError("Données invalides", 400);
  }

  await moderateLiveChatMessage(messageId, status);
  return jsonSuccess();
}
