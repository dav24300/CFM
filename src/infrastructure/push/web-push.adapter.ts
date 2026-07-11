import webpush from "web-push";
import {
  getStoreAsync,
  updateStoreAsync,
  nextId,
} from "@/infrastructure/persistence/store-access";
import { isPgMode } from "@/infrastructure/persistence/sql/sql-client";
import * as sqlPush from "@/infrastructure/repositories/sql/push.sql";
import type { PushSubscription, PushTopic } from "@/domain/entities/v3";

function isVapidConfigured(): boolean {
  return Boolean(
    process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY
  );
}

function configureWebPush(): void {
  if (!isVapidConfigured()) return;
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || "mailto:contact@cfmasbl.com",
    process.env.VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  );
}

export async function savePushSubscription(data: {
  endpoint: string;
  p256dh: string;
  auth: string;
  topics: PushTopic[];
}): Promise<void> {
  if (isPgMode()) return sqlPush.upsertSubscription(data);
  await updateStoreAsync((store) => {
    if (!store.push_subscriptions) store.push_subscriptions = [];
    const idx = store.push_subscriptions.findIndex(
      (s) => s.endpoint === data.endpoint
    );
    const entry: PushSubscription = {
      id: idx >= 0 ? store.push_subscriptions[idx].id : nextId(store),
      endpoint: data.endpoint,
      p256dh: data.p256dh,
      auth: data.auth,
      topics: data.topics,
      created_at: new Date().toISOString(),
    };
    if (idx >= 0) store.push_subscriptions[idx] = entry;
    else store.push_subscriptions.push(entry);
  });
}

export async function removePushSubscription(endpoint: string): Promise<void> {
  if (isPgMode()) return sqlPush.removeSubscription(endpoint);
  await updateStoreAsync((store) => {
    store.push_subscriptions = store.push_subscriptions.filter(
      (s) => s.endpoint !== endpoint
    );
  });
}

export async function getPushSubscriberCount(topic?: PushTopic): Promise<number> {
  if (isPgMode()) return sqlPush.countSubscriptions(topic);
  const store = await getStoreAsync();
  const subs = store.push_subscriptions || [];
  if (!topic) return subs.length;
  return subs.filter((s) => s.topics.includes(topic)).length;
}

export async function sendPushToTopic(
  topic: PushTopic,
  payload: { title: string; body: string; url?: string }
): Promise<{ sent: number; failed: number }> {
  let subs: PushSubscription[];
  if (isPgMode()) {
    subs = await sqlPush.listSubscriptionsByTopic(topic);
  } else {
    const store = await getStoreAsync();
    subs = (store.push_subscriptions || []).filter((s) => s.topics.includes(topic));
  }

  if (!isVapidConfigured() || subs.length === 0) {
    console.log(`[CFM Push] ${topic}: ${payload.title} — ${subs.length} abonnés (mode log)`);
    return { sent: 0, failed: 0 };
  }

  configureWebPush();
  let sent = 0;
  let failed = 0;
  const body = JSON.stringify(payload);

  for (const sub of subs) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        body
      );
      sent++;
    } catch {
      failed++;
      await removePushSubscription(sub.endpoint);
    }
  }
  return { sent, failed };
}

export function getVapidPublicKey(): string | null {
  return process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || process.env.VAPID_PUBLIC_KEY || null;
}
