import { NextRequest } from "next/server";
import { getCurrentMember } from "@/infrastructure/auth/member-auth";
import {
  getMessagesForUser,
  sendMemberMessage,
} from "@/infrastructure/repositories/messages.repository";
import {
  jsonData,
  jsonError,
  jsonSuccess,
  jsonUnauthorized,
} from "@/infrastructure/http/api-response";

export async function GET() {
  const member = await getCurrentMember();
  if (!member) return jsonUnauthorized();
  const messages = await getMessagesForUser(member.id);
  return jsonData({ messages });
}

export async function POST(request: NextRequest) {
  const member = await getCurrentMember();
  if (!member) return jsonUnauthorized();

  let body: { subject?: string; body?: string };
  try {
    body = await request.json();
  } catch {
    return jsonError("Champs invalides", 400);
  }

  const text = typeof body.body === "string" ? body.body.trim() : "";
  if (!text) {
    return jsonError("Message vide", 400);
  }

  await sendMemberMessage(member.id, {
    subject: typeof body.subject === "string" ? body.subject : undefined,
    body: text,
  });
  return jsonSuccess();
}
