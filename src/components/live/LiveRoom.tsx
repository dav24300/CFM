"use client";

import { LivePlayer } from "@/components/live/LivePlayer";
import { LiveChat } from "@/components/live/LiveChat";
import { LivePolls } from "@/components/live/LivePolls";
import type { LiveEvent } from "@/domain/entities/v3";
import type { LivePoll } from "@/domain/entities/v3";
import { Radio } from "lucide-react";

type Labels = {
  live: string;
  replay: string;
  scheduled: string;
  viewers: string;
  chat: {
    title: string;
    placeholder: string;
    send: string;
    pending: string;
    closed: string;
  };
  poll: { vote: string; voted: string };
};

type Props = {
  event: LiveEvent;
  polls: LivePoll[];
  labels: Labels;
};

export function LiveRoom({ event, polls, labels }: Props) {
  const isLive = event.status === "live";
  const statusLabel =
    event.status === "live"
      ? labels.live
      : event.status === "replay" || event.status === "ended"
        ? labels.replay
        : labels.scheduled;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center gap-3">
        {isLive && (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-600 px-3 py-1 text-xs font-bold text-white">
            <Radio className="h-3 w-3 animate-pulse" />
            {labels.live}
          </span>
        )}
        {!isLive && (
          <span className="rounded-full bg-site-primary/20 px-3 py-1 text-xs font-semibold text-site-ink">
            {statusLabel}
          </span>
        )}
        {event.viewer_count > 0 && (
          <span className="text-sm text-site-muted">
            {event.viewer_count} {labels.viewers}
          </span>
        )}
      </div>

      <LivePlayer
        youtubeId={event.youtube_id}
        streamUrl={event.stream_url}
        replayUrl={event.replay_url}
        status={event.status}
      />

      <p className="text-site-muted">{event.description}</p>

      <div className="grid gap-8 lg:grid-cols-2">
        <LiveChat slug={event.slug} isLive={isLive} labels={labels.chat} />
        <div>
          <h2 className="mb-4 font-serif text-xl font-bold">Sondages</h2>
          <LivePolls slug={event.slug} polls={polls} isLive={isLive} labels={labels.poll} />
        </div>
      </div>
    </div>
  );
}
