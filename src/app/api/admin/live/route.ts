import { NextRequest } from "next/server";
import { getAdminAccess } from "@/lib/admin-access";
import {
  createLiveEvent,
  setLiveEventStatus,
  getLiveEvents,
  getChatMessages,
  getPendingChatCount,
} from "@/lib/live";
import { sendPushToTopic } from "@/lib/push";
import { getStore } from "@/lib/store";
import {
  jsonData,
  jsonError,
  jsonForbidden,
  jsonUnauthorized,
} from "@/lib/api-response";
import { logAdminAction } from "@/lib/admin-audit";

export async function GET() {
  const access = await getAdminAccess();
  if (!access) {
    return jsonUnauthorized();
  }
  const events = getLiveEvents();
  const pending = events.map((e) => ({
    eventId: e.id,
    count: getPendingChatCount(e.id),
  }));
  return jsonData({ events, pending });
}

export async function POST(request: NextRequest) {
  const access = await getAdminAccess();
  if (!access) {
    await logAdminAction({
      actorType: "unknown",
      endpoint: "/api/admin/live",
      action: "unauthorized",
      status: "denied",
      ip: request.headers.get("x-forwarded-for") || null,
    });
    return jsonUnauthorized();
  }

  const body = await request.json();
  const { action } = body;

  if (action === "pending_chat" && body.eventId) {
    const msgs = getChatMessages(body.eventId, false).filter(
      (m) => m.status === "pending"
    );
    return jsonData({ messages: msgs });
  }

  if (access !== "admin") {
    await logAdminAction({
      actorType: access,
      endpoint: "/api/admin/live",
      action: String(action),
      status: "denied",
      ip: request.headers.get("x-forwarded-for") || null,
    });
    return jsonForbidden();
  }

  if (action === "create") {
    const event = createLiveEvent({
      title: body.title,
      description: body.description,
      youtube_id: body.youtube_id,
      stream_url: body.stream_url,
      chat_moderation: body.chat_moderation !== false,
    });
    await logAdminAction({
      actorType: "admin",
      endpoint: "/api/admin/live",
      action: "create",
      target: event.slug,
      status: "success",
      ip: request.headers.get("x-forwarded-for") || null,
    });
    return jsonData({ event });
  }

  if (action === "set_status" && body.id) {
    const event = setLiveEventStatus(body.id, body.status, body.replay_url);
    if (body.status === "live" && event) {
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
      await sendPushToTopic("lives", {
        title: `🔴 Live CFM : ${event.title}`,
        body: "Rejoignez-nous en direct maintenant !",
        url: `${baseUrl}/live/${event.slug}`,
      });
    }
    await logAdminAction({
      actorType: "admin",
      endpoint: "/api/admin/live",
      action: "set_status",
      target: String(body.id),
      status: "success",
      ip: request.headers.get("x-forwarded-for") || null,
      metadata: { status: body.status },
    });
    return jsonData({ event });
  }

  if (action === "send_push" && body.topic) {
    const result = await sendPushToTopic(body.topic, {
      title: body.title,
      body: body.body,
      url: body.url,
    });
    await logAdminAction({
      actorType: "admin",
      endpoint: "/api/admin/live",
      action: "send_push",
      target: String(body.topic),
      status: "success",
      ip: request.headers.get("x-forwarded-for") || null,
    });
    return jsonData(result);
  }

  if (action === "stats") {
    const subs = getStore().push_subscriptions?.length ?? 0;
    return jsonData({ push_subscribers: subs });
  }

  return jsonError("Action inconnue", 400);
}
