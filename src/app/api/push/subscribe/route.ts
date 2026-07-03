import { NextRequest } from "next/server";
import { savePushSubscription, removePushSubscription } from "@/lib/push";
import type { PushTopic } from "@/lib/types/v3";
import { jsonError, jsonSuccess } from "@/lib/api-response";

const VALID_TOPICS: PushTopic[] = ["lives", "campaigns", "help"];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { endpoint, keys, topics } = body;

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return jsonError("Données invalides", 400);
    }

    const validTopics = (topics || ["lives"]).filter((t: string) =>
      VALID_TOPICS.includes(t as PushTopic)
    ) as PushTopic[];

    savePushSubscription({
      endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
      topics: validTopics.length ? validTopics : ["lives"],
    });

    return jsonSuccess();
  } catch {
    return jsonError("Erreur serveur", 500);
  }
}

export async function DELETE(request: NextRequest) {
  const { endpoint } = await request.json();
  if (endpoint) removePushSubscription(endpoint);
  return jsonSuccess();
}
