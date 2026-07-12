import { NextRequest } from "next/server";
import { requireAdminAccess } from "@/lib/admin-rest";
import { getClientIp } from "@/lib/rate-limit";
import {
  createLiveEvent,
  setLiveEventStatus,
  getLiveEvents,
  getChatMessages,
  getPendingChatCount,
  updateLiveEventMedia,
  getPollsForEvent,
} from "@/lib/live";
import { sendPushToTopic } from "@/lib/push";
import { countPushSubscriptions } from "@/infrastructure/repositories/live.repository";
import { jsonData, jsonError } from "@/lib/api-response";
import { logAdminAction } from "@/lib/admin-audit";

export async function GET() {
  const auth = await requireAdminAccess();
  if (!auth.ok) return auth.response;
  const events = await getLiveEvents();
  const pending = await Promise.all(
    events.map(async (e) => ({
      eventId: e.id,
      count: await getPendingChatCount(e.id),
    }))
  );
  return jsonData({ events, pending });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminAccess();
  if (!auth.ok) {
    await logAdminAction({
      actorType: "unknown",
      endpoint: "/api/admin/live",
      action: "unauthorized",
      status: "denied",
      ip: getClientIp(request),
    });
    return auth.response;
  }

  const body = await request.json();
  const { action } = body;

  if (action === "pending_chat" && body.eventId) {
    const msgs = (await getChatMessages(body.eventId, false)).filter(
      (m) => m.status === "pending"
    );
    return jsonData({ messages: msgs });
  }

  if (action === "all_chat" && body.eventId) {
    const msgs = await getChatMessages(body.eventId, false);
    return jsonData({ messages: msgs });
  }

  if (action === "polls" && body.eventId) {
    const polls = await getPollsForEvent(body.eventId);
    return jsonData({ polls });
  }

  if (action === "set_thumbnail" && body.id) {
    const event = await updateLiveEventMedia(body.id, {
      thumbnail: body.thumbnail,
      thumbnail_alt: body.thumbnail_alt,
    });
    if (!event) return jsonError("Événement introuvable", 404);
    await logAdminAction({
      actorType: auth.access,
      endpoint: "/api/admin/live",
      action: "set_thumbnail",
      target: String(body.id),
      status: "success",
      ip: getClientIp(request),
    });
    return jsonData({ event });
  }

  if (action === "create") {
    const event = await createLiveEvent({
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
      ip: getClientIp(request),
    });
    return jsonData({ event });
  }

  if (action === "set_status" && body.id) {
    const event = await setLiveEventStatus(body.id, body.status, body.replay_url);
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
      ip: getClientIp(request),
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
      ip: getClientIp(request),
    });
    return jsonData(result);
  }

  if (action === "stats") {
    const subs = await countPushSubscriptions();
    return jsonData({ push_subscribers: subs });
  }

  return jsonError("Action inconnue", 400);
}
