import {
  getStoreAsync,
  updateStoreAsync,
  nextId,
} from "@/infrastructure/persistence/store-access";
import { slugify } from "@/infrastructure/persistence/store-seed";
import { withStoreMutation } from "@/infrastructure/persistence/admin-mutation";
import { invalidateLiveCache } from "@/infrastructure/cache/invalidate";
import { domainError } from "@/domain/errors/domain-error";
import { containsBadWord, sanitizeChatContent } from "@/infrastructure/live/moderation";
import { compareIsoDesc } from "@/infrastructure/persistence/normalize-pg-row";
import type { LiveEvent, LiveChatMessage, LivePoll } from "@/domain/entities/v3";

export async function getLiveEvents(): Promise<LiveEvent[]> {
  const store = await getStoreAsync();
  return [...store.live_events].sort((a, b) =>
    compareIsoDesc(a.created_at, b.created_at)
  );
}

export async function getActiveLiveEvent(): Promise<LiveEvent | undefined> {
  const events = await getLiveEvents();
  return events.find((e) => e.status === "live");
}

export async function getLiveEventBySlug(slug: string): Promise<LiveEvent | undefined> {
  const store = await getStoreAsync();
  return store.live_events.find((e) => e.slug === slug);
}

export async function createLiveEvent(data: {
  title: string;
  description: string;
  youtube_id?: string;
  stream_url?: string;
  chat_moderation?: boolean;
}): Promise<LiveEvent> {
  let created!: LiveEvent;
  await withStoreMutation(
    (store) => {
      const baseSlug = slugify(data.title);
      let slug = baseSlug;
      let n = 1;
      while (store.live_events.some((e) => e.slug === slug)) {
        slug = `${baseSlug}-${n++}`;
      }
      created = {
        id: nextId(store),
        title: data.title,
        slug,
        description: data.description,
        status: "scheduled",
        youtube_id: data.youtube_id || null,
        stream_url: data.stream_url || null,
        replay_url: null,
        chat_moderation: data.chat_moderation ? 1 : 0,
        viewer_count: 0,
        started_at: null,
        ended_at: null,
        created_at: new Date().toISOString(),
      };
      store.live_events.push(created);
    },
    { invalidate: "none" }
  );
  invalidateLiveCache();
  return created!;
}

export async function setLiveEventStatus(
  eventId: number,
  status: LiveEvent["status"],
  replayUrl?: string
): Promise<LiveEvent | undefined> {
  let result: LiveEvent | undefined;
  await updateStoreAsync((store) => {
    const e = store.live_events.find((x) => x.id === eventId);
    if (!e) return;
    e.status = status;
    const now = new Date().toISOString();
    if (status === "live") {
      e.started_at = now;
      store.live_events.forEach((ev) => {
        if (ev.id !== eventId && ev.status === "live") ev.status = "ended";
      });
    }
    if (status === "ended" || status === "replay") {
      e.ended_at = now;
      if (replayUrl) e.replay_url = replayUrl;
    }
    result = e;
  });
  invalidateLiveCache();
  return result;
}

export async function updateLiveEventMedia(
  eventId: number,
  patch: { thumbnail?: string | null; thumbnail_alt?: string | null }
): Promise<LiveEvent | undefined> {
  let result: LiveEvent | undefined;
  await updateStoreAsync((store) => {
    const e = store.live_events.find((x) => x.id === eventId);
    if (!e) return;
    if (patch.thumbnail !== undefined) e.thumbnail = patch.thumbnail;
    if (patch.thumbnail_alt !== undefined) e.thumbnail_alt = patch.thumbnail_alt;
    result = e;
  });
  if (result) invalidateLiveCache();
  return result;
}

export async function getChatMessages(
  eventId: number,
  publicOnly = true
): Promise<LiveChatMessage[]> {
  const store = await getStoreAsync();
  const msgs = store.live_chat_messages.filter((m) => m.live_event_id === eventId);
  const filtered = publicOnly ? msgs.filter((m) => m.status === "approved") : msgs;
  return filtered.sort((a, b) => compareIsoDesc(b.created_at, a.created_at));
}

export async function postChatMessage(data: {
  live_event_id: number;
  author_name: string;
  content: string;
  user_id?: number;
}): Promise<LiveChatMessage> {
  const content = sanitizeChatContent(data.content);
  if (!content) throw domainError("EMPTY_MESSAGE");

  let created!: LiveChatMessage;
  await updateStoreAsync((store) => {
    const event = store.live_events.find((e) => e.id === data.live_event_id);
    if (!event) throw domainError("EVENT_NOT_FOUND");
    if (event.status !== "live") throw domainError("NOT_LIVE");

    const needsMod = event.chat_moderation === 1 || containsBadWord(content);
    created = {
      id: nextId(store),
      live_event_id: data.live_event_id,
      user_id: data.user_id || null,
      author_name: data.author_name.slice(0, 80),
      content,
      status: needsMod ? "pending" : "approved",
      created_at: new Date().toISOString(),
    };
    store.live_chat_messages.push(created);
  });
  return created!;
}

export async function moderateChatMessage(
  messageId: number,
  status: "approved" | "rejected"
): Promise<void> {
  await updateStoreAsync((store) => {
    const m = store.live_chat_messages.find((x) => x.id === messageId);
    if (m) m.status = status;
  });
}

export async function getPollsForEvent(eventId: number): Promise<LivePoll[]> {
  const store = await getStoreAsync();
  return store.live_polls.filter((p) => p.live_event_id === eventId);
}

export async function createLivePoll(
  eventId: number,
  question: string,
  options: string[]
): Promise<LivePoll> {
  let created!: LivePoll;
  await updateStoreAsync((store) => {
    created = {
      id: nextId(store),
      live_event_id: eventId,
      question,
      options: options.map((text, i) => ({
        id: `opt-${i + 1}`,
        text,
        votes: 0,
      })),
      active: 1,
      created_at: new Date().toISOString(),
    };
    store.live_polls.push(created);
  });
  return created!;
}

export async function voteLivePoll(
  pollId: number,
  optionId: string,
  voterKey: string
): Promise<LivePoll | undefined> {
  let poll: LivePoll | undefined;
  await updateStoreAsync((store) => {
    const existing = store.live_poll_votes.find(
      (v) => v.poll_id === pollId && v.voter_key === voterKey
    );
    if (existing) throw domainError("ALREADY_VOTED");

    poll = store.live_polls.find((p) => p.id === pollId);
    if (!poll || poll.active !== 1) throw domainError("POLL_CLOSED");

    const opt = poll.options.find((o) => o.id === optionId);
    if (!opt) throw domainError("INVALID_OPTION");
    opt.votes += 1;

    store.live_poll_votes.push({
      id: nextId(store),
      poll_id: pollId,
      option_id: optionId,
      voter_key: voterKey,
      created_at: new Date().toISOString(),
    });
  });
  return poll;
}

export async function incrementViewerCount(eventId: number): Promise<void> {
  await updateStoreAsync((store) => {
    const e = store.live_events.find((x) => x.id === eventId);
    if (e) e.viewer_count += 1;
  });
}

export async function getPendingChatCount(eventId: number): Promise<number> {
  const store = await getStoreAsync();
  return store.live_chat_messages.filter(
    (m) => m.live_event_id === eventId && m.status === "pending"
  ).length;
}
