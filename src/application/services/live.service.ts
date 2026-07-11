import {
  getLiveEvents,
  getActiveLiveEvent,
  getLiveEventBySlug,
  createLiveEvent,
  setLiveEventStatus,
  updateLiveEvent,
  getChatMessages,
  postChatMessage,
  moderateChatMessage,
  getPollsForEvent,
  createLivePoll,
  voteLivePoll,
  incrementViewerCount,
  getPendingChatCount,
  getChatMessageWithEvent,
} from "@/infrastructure/repositories/live.repository";
import { getCurrentMember } from "@/infrastructure/auth/member-auth";
import { savePushSubscription, getVapidPublicKey } from "@/infrastructure/push/web-push.adapter";
import { triggerLiveEvent } from "@/infrastructure/realtime/pusher.adapter";
import type { PushTopic } from "@/domain/entities/v3";

export {
  getLiveEvents,
  getActiveLiveEvent,
  getLiveEventBySlug,
  createLiveEvent,
  setLiveEventStatus,
  updateLiveEvent,
  getChatMessages,
  moderateChatMessage,
  getPollsForEvent,
  createLivePoll,
  incrementViewerCount,
  getPendingChatCount,
};

export async function postLiveChatMessage(
  slug: string,
  body: { author_name?: string; content: string }
) {
  const event = await getLiveEventBySlug(slug);
  if (!event) throw new Error("NOT_FOUND");

  const member = await getCurrentMember();
  const author_name =
    body.author_name ||
    (member ? `${member.first_name} ${member.last_name}` : "Anonyme");

  const msg = await postChatMessage({
    live_event_id: event.id,
    author_name,
    content: body.content,
    user_id: member?.id,
  });

  await triggerLiveEvent(
    slug,
    msg.status === "approved" ? "chat" : "chat-pending",
    { message: msg }
  );

  return msg;
}

export async function moderateLiveChatMessage(
  messageId: number,
  status: "approved" | "rejected"
) {
  const { msg, event } = await getChatMessageWithEvent(messageId);

  await moderateChatMessage(messageId, status);

  if (event && status === "approved" && msg) {
    await triggerLiveEvent(event.slug, "chat", {
      message: { ...msg, status: "approved" },
    });
  }
  if (event) {
    await triggerLiveEvent(event.slug, "moderation", { messageId, status });
  }
}

export function votePoll(pollId: number, optionId: string, voterKey: string) {
  return voteLivePoll(pollId, optionId, voterKey);
}

export async function subscribePush(data: {
  endpoint: string;
  p256dh: string;
  auth: string;
  topics: PushTopic[];
}): Promise<void> {
  await savePushSubscription(data);
}

export { getVapidPublicKey };
