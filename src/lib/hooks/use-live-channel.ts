"use client";

import { useEffect, useRef } from "react";

type PusherClient = import("pusher-js").default;

export function useLiveChannel(
  slug: string,
  enabled: boolean,
  handlers: {
    onChat?: (data: { message: { id: number; author_name: string; content: string; created_at: string; status?: string } }) => void;
    onModeration?: (data: { messageId: number; status: string }) => void;
  }
) {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
    const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;
    if (!enabled || !key || !cluster) return;

    let pusher: PusherClient | null = null;
    let channel: ReturnType<PusherClient["subscribe"]> | null = null;
    let cancelled = false;

    (async () => {
      const PusherJS = (await import("pusher-js")).default;
      if (cancelled) return;
      pusher = new PusherJS(key, { cluster });
      channel = pusher.subscribe(`live-${slug}`);

      channel.bind("chat", (data: Parameters<NonNullable<typeof handlers.onChat>>[0]) => {
        handlersRef.current.onChat?.(data);
      });
      channel.bind("chat-pending", () => {
        /* client shows pending via POST response */
      });
      channel.bind("moderation", (data: Parameters<NonNullable<typeof handlers.onModeration>>[0]) => {
        handlersRef.current.onModeration?.(data);
      });
    })();

    return () => {
      cancelled = true;
      if (channel) channel.unbind_all();
      if (pusher) pusher.unsubscribe(`live-${slug}`);
      pusher?.disconnect();
    };
  }, [slug, enabled]);
}

export function isLiveRealtimeEnabled(): boolean {
  return Boolean(
    typeof window !== "undefined" &&
      process.env.NEXT_PUBLIC_PUSHER_KEY &&
      process.env.NEXT_PUBLIC_PUSHER_CLUSTER
  );
}
