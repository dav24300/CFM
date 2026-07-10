"use client";

import { AnchorButton } from "@/components/ui/patterns/button-link";

type Props = {
  youtubeId?: string | null;
  streamUrl?: string | null;
  replayUrl?: string | null;
  status: string;
};

function extractYoutubeId(url?: string | null, explicitId?: string | null): string | null {
  if (explicitId?.trim()) return explicitId.trim();
  if (!url) return null;
  const match = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/
  );
  return match?.[1] ?? null;
}

function YoutubeEmbed({ videoId, autoplay = false }: { videoId: string; autoplay?: boolean }) {
  const params = autoplay ? "?autoplay=1" : "";
  return (
    <div className="aspect-video w-full overflow-hidden rounded-xl bg-black media-frame">
      <iframe
        className="h-full w-full"
        src={`https://www.youtube.com/embed/${videoId}${params}`}
        title="CFM Live"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}

export function LivePlayer({ youtubeId, streamUrl, replayUrl, status }: Props) {
  const embedId = extractYoutubeId(replayUrl, youtubeId);

  if (status === "live" && embedId) {
    return <YoutubeEmbed videoId={embedId} autoplay />;
  }

  if (status === "live" && streamUrl) {
    return (
      <div className="aspect-video w-full overflow-hidden rounded-xl bg-black media-frame">
        <video className="h-full w-full" src={streamUrl} controls autoPlay playsInline />
      </div>
    );
  }

  if ((status === "replay" || status === "ended") && embedId) {
    return <YoutubeEmbed videoId={embedId} />;
  }

  if (replayUrl) {
    return (
      <div className="card text-center">
        <p className="text-site-muted">Replay disponible</p>
        <AnchorButton href={replayUrl} target="_blank" rel="noopener noreferrer" className="mt-4">
          Voir le replay
        </AnchorButton>
      </div>
    );
  }

  return (
    <div className="flex aspect-video items-center justify-center rounded-xl border-2 border-dashed border-site-primary/40 bg-site-deep/5">
      <p className="text-site-muted">Diffusion à venir</p>
    </div>
  );
}
