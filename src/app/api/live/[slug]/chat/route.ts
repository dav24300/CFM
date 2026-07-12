import { NextRequest } from "next/server";
import { getLiveEventBySlug, getChatMessages, postLiveChatMessage } from "@/application/services/live.service";
import { jsonData, jsonError, jsonNotFound, handleDomainError } from "@/infrastructure/http/api-response";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const event = await getLiveEventBySlug(slug);
  if (!event) {
    return jsonNotFound("Introuvable");
  }
  const messages = await getChatMessages(event.id, true);
  return jsonData({ messages });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const body = await request.json();
    const msg = await postLiveChatMessage(slug, body);

    return jsonData({
      message: msg.status === "approved" ? msg : { status: msg.status },
      pending: msg.status === "pending",
    });
  } catch (err) {
    return handleDomainError(err);
  }
}
