import { NextRequest } from "next/server";
import { requireAdminAccess } from "@/lib/admin-rest";
import { getClientIp } from "@/infrastructure/rate-limit/memory";
import {
  createLiveEvent,
  setLiveEventStatus,
  getLiveEvents,
  getChatMessages,
  getPendingChatCount,
  updateLiveEventMedia,
  getPollsForEvent,
} from "@/infrastructure/repositories/live.repository";
import { sendPushToTopic } from "@/infrastructure/push/web-push.adapter";
import { countPushSubscriptions } from "@/infrastructure/repositories/live.repository";
import { jsonData, jsonError } from "@/infrastructure/http/api-response";
import { logAdminAction } from "@/lib/admin-audit";
import { parseOrBadRequest } from "@/lib/validators";
import { adminLiveActionSchema } from "@/lib/validators/admin-api";

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

  const parsed = parseOrBadRequest(
    adminLiveActionSchema,
    await request.json().catch(() => null),
    "Action inconnue"
  );
  if (!parsed.ok) return parsed.response;
  const body = parsed.data;

  switch (body.action) {
    case "pending_chat": {
      const msgs = (await getChatMessages(body.eventId, false)).filter(
        (m) => m.status === "pending"
      );
      return jsonData({ messages: msgs });
    }

    case "all_chat": {
      const msgs = await getChatMessages(body.eventId, false);
      return jsonData({ messages: msgs });
    }

    case "polls": {
      const polls = await getPollsForEvent(body.eventId);
      return jsonData({ polls });
    }

    case "set_thumbnail": {
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

    case "create": {
      const event = await createLiveEvent({
        title: body.title,
        description: body.description ?? "",
        youtube_id: body.youtube_id ?? undefined,
        stream_url: body.stream_url ?? undefined,
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

    case "set_status": {
      const event = await setLiveEventStatus(
        body.id,
        body.status,
        body.replay_url ?? undefined
      );
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

    case "send_push": {
      const result = await sendPushToTopic(body.topic, {
        title: body.title,
        body: body.body,
        url: body.url ?? undefined,
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

    case "stats": {
      const subs = await countPushSubscriptions();
      return jsonData({ push_subscribers: subs });
    }
  }

  // Inatteignable (union discriminée exhaustive) — parité défensive.
  return jsonError("Action inconnue", 400);
}
