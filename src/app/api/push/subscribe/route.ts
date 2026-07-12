import { NextRequest } from "next/server";
import { savePushSubscription, removePushSubscription } from "@/lib/push";
import type { PushTopic } from "@/lib/types/v3";
import { jsonError, jsonSuccess } from "@/lib/api-response";
import { parseOrBadRequest } from "@/lib/validators";
import { pushSubscribeSchema, pushUnsubscribeSchema } from "@/lib/validators/public-api";

const VALID_TOPICS: PushTopic[] = ["lives", "campaigns", "help"];

export async function POST(request: NextRequest) {
  const parsed = parseOrBadRequest(
    pushSubscribeSchema,
    await request.json().catch(() => null),
    "Données invalides"
  );
  if (!parsed.ok) return parsed.response;
  const { endpoint, keys, topics } = parsed.data;

  // Topics inconnus filtrés (jamais rejetés) — parité historique.
  const validTopics = (topics || ["lives"]).filter((t): t is PushTopic =>
    VALID_TOPICS.includes(t as PushTopic)
  );

  try {
    await savePushSubscription({
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
  const parsed = parseOrBadRequest(
    pushUnsubscribeSchema,
    await request.json().catch(() => null),
    "Données invalides"
  );
  if (!parsed.ok) return parsed.response;

  await removePushSubscription(parsed.data.endpoint);
  return jsonSuccess();
}
