import { NextRequest } from "next/server";
import { getLiveEventBySlug, getChatMessages, postLiveChatMessage } from "@/application/services/live.service";
import { jsonData, jsonError, jsonNotFound, handleDomainError } from "@/infrastructure/http/api-response";

/** Fenêtre initiale : au-delà, l'historique n'est plus lisible à l'écran. */
const DEFAULT_CHAT_LIMIT = 100;
const MAX_CHAT_LIMIT = 200;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const event = await getLiveEventBySlug(slug);
  if (!event) {
    return jsonNotFound("Introuvable");
  }

  // `?since=<id>` : le client en polling ne redemande que le delta au lieu de
  // rapatrier tout l'historique toutes les 3 s.
  const sinceRaw = Number.parseInt(request.nextUrl.searchParams.get("since") ?? "", 10);
  const sinceId = Number.isFinite(sinceRaw) && sinceRaw > 0 ? sinceRaw : undefined;
  const limitRaw = Number.parseInt(request.nextUrl.searchParams.get("limit") ?? "", 10);
  const limit = Math.min(
    Number.isFinite(limitRaw) && limitRaw > 0 ? limitRaw : DEFAULT_CHAT_LIMIT,
    MAX_CHAT_LIMIT
  );

  const messages = await getChatMessages(event.id, true, { limit, sinceId });
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
