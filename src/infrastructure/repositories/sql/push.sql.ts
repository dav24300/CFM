import "server-only";
import type { PushSubscription, PushTopic } from "@/domain/entities/v3";
import { mapPgError } from "@/infrastructure/persistence/sql/pg-errors";
import { normalizePgRows } from "@/infrastructure/persistence/normalize-pg-row";
import { query } from "@/infrastructure/persistence/sql/sql-client";

/** Agrégat push_subscriptions en SQL ciblé (mode PG). */

export async function upsertSubscription(data: {
  endpoint: string;
  p256dh: string;
  auth: string;
  topics: PushTopic[];
}): Promise<void> {
  try {
    // Iso branche Store : l'id est conservé sur ré-abonnement, tous les autres
    // champs (y compris created_at) sont rafraîchis.
    await query(
      `INSERT INTO push_subscriptions (endpoint, p256dh, auth, topics, created_at)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (endpoint) DO UPDATE SET
         p256dh = EXCLUDED.p256dh, auth = EXCLUDED.auth,
         topics = EXCLUDED.topics, created_at = EXCLUDED.created_at`,
      [data.endpoint, data.p256dh, data.auth, data.topics, new Date().toISOString()]
    );
  } catch (err) {
    mapPgError(err);
  }
}

export async function removeSubscription(endpoint: string): Promise<void> {
  try {
    await query("DELETE FROM push_subscriptions WHERE endpoint = $1", [endpoint]);
  } catch (err) {
    mapPgError(err);
  }
}

export async function countSubscriptions(topic?: PushTopic): Promise<number> {
  try {
    const res = topic
      ? await query<{ n: number }>(
          "SELECT COUNT(*)::int AS n FROM push_subscriptions WHERE $1 = ANY(topics)",
          [topic]
        )
      : await query<{ n: number }>("SELECT COUNT(*)::int AS n FROM push_subscriptions");
    return res.rows[0].n;
  } catch (err) {
    mapPgError(err);
  }
}

export async function listSubscriptionsByTopic(topic: PushTopic): Promise<PushSubscription[]> {
  try {
    const res = await query<PushSubscription>(
      "SELECT * FROM push_subscriptions WHERE $1 = ANY(topics) ORDER BY id",
      [topic]
    );
    return normalizePgRows(res.rows);
  } catch (err) {
    mapPgError(err);
  }
}
