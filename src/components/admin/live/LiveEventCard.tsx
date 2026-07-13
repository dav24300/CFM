"use client";

import { Input } from "@/components/ui/primitives/input";
import type { AdminLiveEvent } from "@/components/admin/hooks/live-admin-api";

type Props = {
  event: AdminLiveEvent;
  pendingCount: number;
  onSetStatus: (id: number, status: string) => void;
  onPublishReplay: (event: AdminLiveEvent) => void;
  onEdit: (id: number) => void;
  onModerateChat: (id: number) => void;
  onAllChat: (id: number) => void;
  onPolls: (id: number) => void;
  onThumbnail: (id: number) => void;
  onCreatePoll: (e: React.FormEvent<HTMLFormElement>, eventId: number) => void;
};

/** Une carte événement live + son mini-formulaire de sondage. */
export function LiveEventCard({
  event: ev,
  pendingCount,
  onSetStatus,
  onPublishReplay,
  onEdit,
  onModerateChat,
  onAllChat,
  onPolls,
  onThumbnail,
  onCreatePoll,
}: Props) {
  return (
    <div className="rounded-lg bg-admin-surface p-4 shadow text-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <strong>{ev.title}</strong>
          <span className="ml-2 text-admin-accent">{ev.status}</span>
          {pendingCount > 0 && (
            <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800">
              {pendingCount} chat
            </span>
          )}
          <a href={`/live/${ev.slug}`} className="ml-2 text-xs text-blue-600 hover:underline" target="_blank" rel="noreferrer">
            Voir →
          </a>
        </div>
        <div className="flex flex-wrap gap-2">
          {ev.status === "scheduled" && (
            <button type="button" onClick={() => onSetStatus(ev.id, "live")} className="rounded bg-admin-danger-fg px-2 py-1 text-xs text-white">
              Démarrer live
            </button>
          )}
          {ev.status === "live" && (
            <button type="button" onClick={() => onSetStatus(ev.id, "ended")} className="rounded bg-admin-deep px-2 py-1 text-xs text-white">
              Terminer
            </button>
          )}
          {(ev.status === "ended" || ev.status === "live") && (
            <button
              type="button"
              onClick={() => onPublishReplay(ev)}
              className="rounded bg-admin-deep px-2 py-1 text-xs text-white"
            >
              Publier replay
            </button>
          )}
          <button type="button" onClick={() => onEdit(ev.id)} className="rounded border px-2 py-1 text-xs">
            Modifier
          </button>
          <button type="button" onClick={() => onModerateChat(ev.id)} className="rounded border px-2 py-1 text-xs">
            Modérer chat
          </button>
          <button type="button" onClick={() => onAllChat(ev.id)} className="rounded border px-2 py-1 text-xs">
            Historique chat
          </button>
          <button type="button" onClick={() => onPolls(ev.id)} className="rounded border px-2 py-1 text-xs">
            Sondages
          </button>
          <button type="button" onClick={() => onThumbnail(ev.id)} className="rounded border px-2 py-1 text-xs">
            Miniature
          </button>
        </div>
      </div>
      {ev.thumbnail && (
        <p className="mt-1 truncate text-xs text-admin-muted">Miniature : {ev.thumbnail}</p>
      )}
      <form onSubmit={(e) => onCreatePoll(e, ev.id)} className="mt-3 flex flex-wrap gap-2 border-t pt-3">
        <Input name="question" placeholder="Sondage…" className="flex-1 min-w-[120px] text-xs" />
        <Input name="opt1" placeholder="Option 1" className="w-24 text-xs" required />
        <Input name="opt2" placeholder="Option 2" className="w-24 text-xs" required />
        <button type="submit" className="rounded bg-admin-accent px-2 py-1 text-xs font-semibold text-admin-ink">
          + Sondage
        </button>
      </form>
    </div>
  );
}
