import "server-only";
import type { LiveEvent, LiveChatMessage, LivePoll, LivePollVote } from "@/domain/entities/v3";
import { domainError } from "@/domain/errors/domain-error";
import { containsBadWord, sanitizeChatContent } from "@/infrastructure/live/moderation";
import { normalizePgRow, normalizePgRows } from "@/infrastructure/persistence/normalize-pg-row";
import { demoLiveEventSeed, slugify } from "@/infrastructure/persistence/store-seed";
import { mapPgError } from "@/infrastructure/persistence/sql/pg-errors";
import { query, withTransaction } from "@/infrastructure/persistence/sql/sql-client";

/**
 * Agrégat live en SQL ciblé (mode PG) :
 * live_events, live_chat_messages, live_polls, live_poll_votes.
 * Mêmes signatures et mêmes comportements que la branche Store de
 * live.repository ; l'anti-double-vote repose sur la contrainte unique
 * live_poll_votes_poll_id_voter_key_key (concurrent-safe), le compteur de
 * spectateurs sur un UPDATE incrémental atomique.
 */

export async function getLiveEvents(): Promise<LiveEvent[]> {
  try {
    const res = await query<LiveEvent>(
      "SELECT * FROM live_events ORDER BY created_at DESC, id ASC"
    );
    return normalizePgRows(res.rows);
  } catch (err) {
    mapPgError(err);
  }
}

export async function getLiveEventBySlug(slug: string): Promise<LiveEvent | undefined> {
  try {
    const res = await query<LiveEvent>(
      "SELECT * FROM live_events WHERE slug = $1 LIMIT 1",
      [slug]
    );
    return res.rows[0] ? normalizePgRow(res.rows[0]) : undefined;
  } catch (err) {
    mapPgError(err);
  }
}

export async function createLiveEvent(data: {
  title: string;
  description: string;
  youtube_id?: string;
  stream_url?: string;
  chat_moderation?: boolean;
}): Promise<LiveEvent> {
  try {
    // Suffixe -1, -2… en cas de collision de slug (parité Store) ; l'insert
    // ON CONFLICT DO NOTHING rend la boucle concurrent-safe.
    const baseSlug = slugify(data.title);
    let slug = baseSlug;
    let n = 1;
    for (;;) {
      const res = await query<LiveEvent>(
        `INSERT INTO live_events (title, slug, description, status, youtube_id, stream_url,
                                  replay_url, chat_moderation, viewer_count, started_at, ended_at, created_at)
         VALUES ($1, $2, $3, 'scheduled', $4, $5, NULL, $6, 0, NULL, NULL, $7)
         ON CONFLICT (slug) DO NOTHING
         RETURNING *`,
        [
          data.title,
          slug,
          data.description,
          data.youtube_id || null,
          data.stream_url || null,
          data.chat_moderation ? 1 : 0,
          new Date().toISOString(),
        ]
      );
      if (res.rows[0]) return normalizePgRow(res.rows[0]);
      slug = `${baseSlug}-${n++}`;
    }
  } catch (err) {
    mapPgError(err);
  }
}

export async function setLiveEventStatus(
  eventId: number,
  status: LiveEvent["status"],
  replayUrl?: string
): Promise<LiveEvent | undefined> {
  return withTransaction(async (client) => {
    const now = new Date().toISOString();
    const sets = ["status = $2"];
    const params: unknown[] = [eventId, status];
    if (status === "live") {
      params.push(now);
      sets.push(`started_at = $${params.length}`);
    }
    if (status === "ended" || status === "replay") {
      params.push(now);
      sets.push(`ended_at = $${params.length}`);
      if (replayUrl) {
        params.push(replayUrl);
        sets.push(`replay_url = $${params.length}`);
      }
    }
    const res = await client.query<LiveEvent>(
      `UPDATE live_events SET ${sets.join(", ")} WHERE id = $1 RETURNING *`,
      params
    );
    if (!res.rows[0]) return undefined; // introuvable : aucun effet de bord (parité Store)
    if (status === "live") {
      // Un seul live à la fois : les autres passent "ended" (statut seul, parité Store).
      await client.query(
        "UPDATE live_events SET status = 'ended' WHERE id <> $1 AND status = 'live'",
        [eventId]
      );
    }
    return normalizePgRow(res.rows[0]);
  }).catch((err) => mapPgError(err));
}

export async function updateLiveEventMedia(
  eventId: number,
  patch: { thumbnail?: string | null; thumbnail_alt?: string | null }
): Promise<LiveEvent | undefined> {
  return patchLiveEvent(eventId, patch, ["thumbnail", "thumbnail_alt"] as const);
}

export async function updateLiveEvent(
  eventId: number,
  patch: {
    title?: string;
    description?: string;
    youtube_id?: string | null;
    stream_url?: string | null;
    replay_url?: string | null;
    chat_moderation?: 0 | 1;
  }
): Promise<LiveEvent | undefined> {
  return patchLiveEvent(eventId, patch, [
    "title",
    "description",
    "youtube_id",
    "stream_url",
    "replay_url",
    "chat_moderation",
  ] as const);
}

/** Patch partiel commun ; patch vide → événement inchangé (parité Store). */
async function patchLiveEvent<K extends keyof LiveEvent>(
  eventId: number,
  patch: Partial<Pick<LiveEvent, K>>,
  allowed: readonly K[]
): Promise<LiveEvent | undefined> {
  const fields = allowed.filter((k) => patch[k] !== undefined);
  try {
    const res = fields.length
      ? await query<LiveEvent>(
          `UPDATE live_events SET ${fields
            .map((k, i) => `"${String(k)}" = $${i + 2}`)
            .join(", ")} WHERE id = $1 RETURNING *`,
          [eventId, ...fields.map((k) => patch[k] as unknown)]
        )
      : await query<LiveEvent>("SELECT * FROM live_events WHERE id = $1", [eventId]);
    return res.rows[0] ? normalizePgRow(res.rows[0]) : undefined;
  } catch (err) {
    mapPgError(err);
  }
}

/**
 * Messages d'un live, du plus ancien au plus récent.
 *
 * `limit` borne la fenêtre (les N DERNIERS messages) et `sinceId` ne renvoie
 * que les messages postérieurs à un id connu : sans eux, chaque tick de
 * polling rapatriait tout l'historique de l'événement.
 */
export async function getChatMessages(
  eventId: number,
  publicOnly = true,
  options: { limit?: number; sinceId?: number } = {}
): Promise<LiveChatMessage[]> {
  const { limit, sinceId } = options;
  try {
    const params: unknown[] = [eventId];
    let where = `live_event_id = $1${publicOnly ? " AND status = 'approved'" : ""}`;
    if (sinceId !== undefined) {
      params.push(sinceId);
      where += ` AND id > $${params.length}`;
    }

    if (limit === undefined) {
      const res = await query<LiveChatMessage>(
        `SELECT * FROM live_chat_messages WHERE ${where} ORDER BY created_at ASC, id ASC`,
        params
      );
      return normalizePgRows(res.rows);
    }

    // Fenêtre glissante : on prend les N plus récents (DESC + LIMIT, servi par
    // idx_live_chat_event_created) puis on rétablit l'ordre chronologique.
    params.push(limit);
    const res = await query<LiveChatMessage>(
      `SELECT * FROM live_chat_messages WHERE ${where}
       ORDER BY created_at DESC, id DESC LIMIT $${params.length}`,
      params
    );
    return normalizePgRows(res.rows).reverse();
  } catch (err) {
    mapPgError(err);
  }
}

export async function postChatMessage(data: {
  live_event_id: number;
  author_name: string;
  content: string;
  user_id?: number;
}): Promise<LiveChatMessage> {
  const content = sanitizeChatContent(data.content);
  if (!content) throw domainError("EMPTY_MESSAGE");

  return withTransaction(async (client) => {
    const event = await client.query<{ status: string; chat_moderation: number }>(
      "SELECT status, chat_moderation FROM live_events WHERE id = $1",
      [data.live_event_id]
    );
    if (event.rowCount === 0) throw domainError("EVENT_NOT_FOUND");
    if (event.rows[0].status !== "live") throw domainError("NOT_LIVE");

    const needsMod = event.rows[0].chat_moderation === 1 || containsBadWord(content);
    const res = await client.query<LiveChatMessage>(
      `INSERT INTO live_chat_messages (live_event_id, user_id, author_name, content, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        data.live_event_id,
        data.user_id || null,
        data.author_name.slice(0, 80),
        content,
        needsMod ? "pending" : "approved",
        new Date().toISOString(),
      ]
    );
    return normalizePgRow(res.rows[0]);
  }).catch((err) => mapPgError(err));
}

export async function moderateChatMessage(
  messageId: number,
  status: "approved" | "rejected"
): Promise<void> {
  try {
    // Message introuvable : no-op silencieux (parité Store).
    await query("UPDATE live_chat_messages SET status = $2 WHERE id = $1", [
      messageId,
      status,
    ]);
  } catch (err) {
    mapPgError(err);
  }
}

export async function getChatMessageWithEvent(messageId: number): Promise<{
  msg: LiveChatMessage | undefined;
  event: LiveEvent | undefined;
}> {
  try {
    const msgRes = await query<LiveChatMessage>(
      "SELECT * FROM live_chat_messages WHERE id = $1",
      [messageId]
    );
    const msg = msgRes.rows[0] ? normalizePgRow(msgRes.rows[0]) : undefined;
    if (!msg) return { msg: undefined, event: undefined };
    const eventRes = await query<LiveEvent>("SELECT * FROM live_events WHERE id = $1", [
      msg.live_event_id,
    ]);
    const event = eventRes.rows[0] ? normalizePgRow(eventRes.rows[0]) : undefined;
    return { msg, event };
  } catch (err) {
    mapPgError(err);
  }
}

export async function getLiveAdminCounters(): Promise<{
  liveEvents: number;
  pendingChat: number;
}> {
  try {
    const [events, pending] = await Promise.all([
      query<{ n: number }>("SELECT COUNT(*)::int AS n FROM live_events"),
      query<{ n: number }>(
        "SELECT COUNT(*)::int AS n FROM live_chat_messages WHERE status = 'pending'"
      ),
    ]);
    return { liveEvents: events.rows[0].n, pendingChat: pending.rows[0].n };
  } catch (err) {
    mapPgError(err);
  }
}

export async function getPollsForEvent(eventId: number): Promise<LivePoll[]> {
  try {
    // Ordre d'insertion (id ASC) — équivalent du filter Store.
    const res = await query<LivePoll>(
      "SELECT * FROM live_polls WHERE live_event_id = $1 ORDER BY id",
      [eventId]
    );
    return normalizePgRows(res.rows);
  } catch (err) {
    mapPgError(err);
  }
}

export async function createLivePoll(
  eventId: number,
  question: string,
  options: string[]
): Promise<LivePoll> {
  try {
    const res = await query<LivePoll>(
      `INSERT INTO live_polls (live_event_id, question, options, active, created_at)
       VALUES ($1, $2, $3::jsonb, 1, $4)
       RETURNING *`,
      [
        eventId,
        question,
        JSON.stringify(options.map((text, i) => ({ id: `opt-${i + 1}`, text, votes: 0 }))),
        new Date().toISOString(),
      ]
    );
    return normalizePgRow(res.rows[0]);
  } catch (err) {
    mapPgError(err);
  }
}

export async function voteLivePoll(
  pollId: number,
  optionId: string,
  voterKey: string
): Promise<LivePoll> {
  return withTransaction(async (client) => {
    // Ordre des gardes identique à la branche Store : doublon d'abord.
    const existing = await client.query(
      "SELECT 1 FROM live_poll_votes WHERE poll_id = $1 AND voter_key = $2",
      [pollId, voterKey]
    );
    if ((existing.rowCount ?? 0) > 0) throw domainError("ALREADY_VOTED");

    const pollRes = await client.query<LivePoll>(
      "SELECT * FROM live_polls WHERE id = $1 FOR UPDATE",
      [pollId]
    );
    const poll = pollRes.rows[0];
    if (!poll || poll.active !== 1) throw domainError("POLL_CLOSED");

    if (!poll.options.some((o) => o.id === optionId)) throw domainError("INVALID_OPTION");

    try {
      await client.query(
        `INSERT INTO live_poll_votes (poll_id, option_id, voter_key, created_at)
         VALUES ($1, $2, $3, $4)`,
        [pollId, optionId, voterKey, new Date().toISOString()]
      );
    } catch (err) {
      mapPgError(err); // 23505 live_poll_votes_poll_id_voter_key_key → ALREADY_VOTED
    }

    // Recomptage JSONB : tableau reconstruit côté JS sous verrou FOR UPDATE.
    const options = poll.options.map((o) =>
      o.id === optionId ? { ...o, votes: o.votes + 1 } : o
    );
    await client.query("UPDATE live_polls SET options = $2::jsonb WHERE id = $1", [
      pollId,
      JSON.stringify(options),
    ]);
    return normalizePgRow({ ...poll, options });
  }).catch((err) => mapPgError(err));
}

export async function incrementViewerCount(eventId: number): Promise<void> {
  try {
    // Incrément atomique côté SQL — concurrent-safe, id inconnu = no-op (parité Store).
    await query("UPDATE live_events SET viewer_count = viewer_count + 1 WHERE id = $1", [
      eventId,
    ]);
  } catch (err) {
    mapPgError(err);
  }
}

export async function getPendingChatCount(eventId: number): Promise<number> {
  try {
    const res = await query<{ n: number }>(
      "SELECT COUNT(*)::int AS n FROM live_chat_messages WHERE live_event_id = $1 AND status = 'pending'",
      [eventId]
    );
    return res.rows[0].n;
  } catch (err) {
    mapPgError(err);
  }
}

export async function closeLivePoll(pollId: number): Promise<LivePoll | undefined> {
  try {
    const res = await query<LivePoll>(
      "UPDATE live_polls SET active = 0 WHERE id = $1 RETURNING *",
      [pollId]
    );
    return res.rows[0] ? normalizePgRow(res.rows[0]) : undefined;
  } catch (err) {
    mapPgError(err);
  }
}

export async function getPollById(pollId: number): Promise<LivePoll | undefined> {
  try {
    const res = await query<LivePoll>("SELECT * FROM live_polls WHERE id = $1", [pollId]);
    return res.rows[0] ? normalizePgRow(res.rows[0]) : undefined;
  } catch (err) {
    mapPgError(err);
  }
}

export async function getPollVotes(pollId: number): Promise<LivePollVote[]> {
  try {
    const res = await query<LivePollVote>(
      "SELECT * FROM live_poll_votes WHERE poll_id = $1 ORDER BY id",
      [pollId]
    );
    return normalizePgRows(res.rows);
  } catch (err) {
    mapPgError(err);
  }
}

/**
 * Seed one-shot du live de démo V3 (table migrée = plus couverte par le
 * sync Store). Appelé uniquement depuis le chemin claimSeedVersion (sérialisé).
 */
export async function seedDefaultLiveEventIfEmpty(): Promise<void> {
  try {
    const count = await query<{ n: number }>("SELECT COUNT(*)::int AS n FROM live_events");
    if (count.rows[0].n > 0) return;
    const seed = demoLiveEventSeed(new Date().toISOString());
    await query(
      `INSERT INTO live_events (title, slug, description, status, youtube_id, stream_url,
                                replay_url, chat_moderation, viewer_count, started_at, ended_at, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       ON CONFLICT (slug) DO NOTHING`,
      [
        seed.title,
        seed.slug,
        seed.description,
        seed.status,
        seed.youtube_id,
        seed.stream_url,
        seed.replay_url,
        seed.chat_moderation,
        seed.viewer_count,
        seed.started_at,
        seed.ended_at,
        seed.created_at,
      ]
    );
  } catch (err) {
    mapPgError(err);
  }
}
