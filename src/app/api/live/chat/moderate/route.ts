import { NextRequest } from "next/server";
import { getAdminAccess } from "@/lib/admin-access";
import { moderateChatMessage } from "@/lib/live";
import { jsonError, jsonSuccess, jsonUnauthorized } from "@/lib/api-response";

export async function POST(request: NextRequest) {
  if (!(await getAdminAccess())) {
    return jsonUnauthorized();
  }

  const { messageId, status } = await request.json();
  if (!messageId || !["approved", "rejected"].includes(status)) {
    return jsonError("Données invalides", 400);
  }

  await moderateChatMessage(messageId, status);
  return jsonSuccess();
}
