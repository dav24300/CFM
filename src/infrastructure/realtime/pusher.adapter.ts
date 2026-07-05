import "server-only";
import Pusher from "pusher";

export type LiveRealtimeEvent =
  | "chat"
  | "chat-pending"
  | "poll"
  | "moderation";

let pusher: Pusher | null = null;

export function isPusherEnabled(): boolean {
  return Boolean(
    process.env.PUSHER_APP_ID &&
      process.env.PUSHER_KEY &&
      process.env.PUSHER_SECRET &&
      process.env.PUSHER_CLUSTER
  );
}

function getPusher(): Pusher | null {
  if (!isPusherEnabled()) return null;
  if (!pusher) {
    pusher = new Pusher({
      appId: process.env.PUSHER_APP_ID!,
      key: process.env.PUSHER_KEY!,
      secret: process.env.PUSHER_SECRET!,
      cluster: process.env.PUSHER_CLUSTER!,
      useTLS: true,
    });
  }
  return pusher;
}

export function liveChannel(slug: string): string {
  return `live-${slug}`;
}

export async function triggerLiveEvent(
  slug: string,
  event: LiveRealtimeEvent,
  payload: Record<string, unknown>
): Promise<void> {
  const client = getPusher();
  if (!client) return;
  try {
    await client.trigger(liveChannel(slug), event, payload);
  } catch (err) {
    console.error("[CFM Pusher]", err);
  }
}
