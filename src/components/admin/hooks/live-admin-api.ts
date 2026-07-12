"use client";

/**
 * Appels API typés du panneau Live admin (extraits de AdminV3Panel — P4.2).
 * URLs, méthodes et corps JSON strictement identiques à l'ancien inline :
 * le god-endpoint /api/admin/live et /api/live/* ont été durcis en zod (P2),
 * toute modification de corps casserait la validation.
 */

const LIVE_URL = "/api/admin/live";
const JSON_HEADERS = { "Content-Type": "application/json" } as const;

export type LivePoll = {
  id: number;
  question: string;
  active: number;
  options: { id: string; text: string; votes: number }[];
};

export type ChatMsg = {
  id: number;
  author_name: string;
  content: string;
  status: string;
  created_at?: string;
};

export type AdminLiveEvent = {
  id: number;
  title: string;
  slug: string;
  status: string;
  viewer_count: number;
  chat_moderation: number;
  thumbnail?: string | null;
  replay_url?: string | null;
  stream_url?: string | null;
  youtube_id?: string | null;
  description?: string;
};

export type PendingCount = { eventId: number; count: number };

export type ModerationStatus = "approved" | "rejected";

function postLive(body: Record<string, unknown>) {
  return fetch(LIVE_URL, {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify(body),
  });
}

/** GET /api/admin/live → liste des événements + compteurs en attente. */
export async function fetchLiveEvents(): Promise<{
  events: AdminLiveEvent[];
  pending: PendingCount[];
} | null> {
  const res = await fetch(LIVE_URL);
  if (!res.ok) return null;
  const data = await res.json();
  return { events: data.events, pending: data.pending || [] };
}

/** POST {action:"stats"} → nombre d'abonnés push. */
export async function fetchPushStats(): Promise<number | null> {
  const res = await postLive({ action: "stats" });
  if (!res.ok) return null;
  const stats = await res.json();
  return stats.push_subscribers ?? 0;
}

/** POST {action:"create", …} — création d'un live. */
export async function createLiveEvent(values: {
  title: unknown;
  description: unknown;
  youtube_id?: unknown;
  chat_moderation: unknown;
}): Promise<void> {
  await postLive({
    action: "create",
    title: values.title,
    description: values.description,
    youtube_id: values.youtube_id || undefined,
    chat_moderation: Boolean(values.chat_moderation),
  });
}

/** PATCH /api/admin/live/:id — édition d'un live. */
export async function updateLiveEvent(
  id: number,
  values: Record<string, unknown>
): Promise<void> {
  await fetch(`${LIVE_URL}/${id}`, {
    method: "PATCH",
    headers: JSON_HEADERS,
    body: JSON.stringify({
      title: values.title,
      description: values.description,
      youtube_id: values.youtube_id || null,
      stream_url: values.stream_url || null,
      replay_url: values.replay_url || null,
    }),
  });
}

/** POST {action:"set_status", …} — change le statut (live/ended/replay…). */
export async function setLiveStatus(
  id: number,
  status: string,
  replay_url?: string
): Promise<void> {
  await postLive({ action: "set_status", id, status, replay_url });
}

/** POST {action:"set_thumbnail", …} — définit la miniature. */
export async function setThumbnail(id: number, thumbnail: string): Promise<void> {
  await postLive({ action: "set_thumbnail", id, thumbnail });
}

/** POST {action:"pending_chat", …} → messages en attente de modération. */
export async function loadPendingChat(eventId: number): Promise<ChatMsg[] | null> {
  const res = await postLive({ action: "pending_chat", eventId });
  if (!res.ok) return null;
  const data = await res.json();
  return data.messages as ChatMsg[];
}

/** POST {action:"all_chat", …} → historique complet du chat. */
export async function loadAllChat(eventId: number): Promise<ChatMsg[] | null> {
  const res = await postLive({ action: "all_chat", eventId });
  if (!res.ok) return null;
  const data = await res.json();
  return data.messages as ChatMsg[];
}

/** POST {action:"polls", …} → sondages d'un événement. */
export async function loadPolls(eventId: number): Promise<LivePoll[] | null> {
  const res = await postLive({ action: "polls", eventId });
  if (!res.ok) return null;
  const data = await res.json();
  return data.polls as LivePoll[];
}

/** PATCH /api/admin/live/polls/:id {active:0} — ferme un sondage. */
export async function closePoll(pollId: number): Promise<void> {
  await fetch(`${LIVE_URL}/polls/${pollId}`, {
    method: "PATCH",
    headers: JSON_HEADERS,
    body: JSON.stringify({ active: 0 }),
  });
}

/** POST /api/live/chat/moderate — modère un message. */
export async function moderateChat(
  messageId: number,
  status: ModerationStatus
): Promise<void> {
  await fetch("/api/live/chat/moderate", {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify({ messageId, status }),
  });
}

/**
 * Modération en masse — en PARALLÈLE (P4.2 : remplace la boucle séquentielle).
 * Résultat fonctionnel identique : tous les messages passés sont modérés.
 */
export async function moderateChatBulk(
  messages: ChatMsg[],
  status: ModerationStatus
): Promise<void> {
  await Promise.all(messages.map((m) => moderateChat(m.id, status)));
}

/** POST /api/live/:slug/polls — crée un sondage. */
export async function createPoll(
  slug: string,
  body: { question: unknown; options: string[] }
): Promise<void> {
  await fetch(`/api/live/${slug}/polls`, {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify({ question: body.question, options: body.options }),
  });
}

/** POST {action:"send_push", …} — envoie une notification push. */
export async function sendPush(form: {
  topic: string;
  title: string;
  body: string;
}): Promise<void> {
  await postLive({ action: "send_push", ...form });
}
