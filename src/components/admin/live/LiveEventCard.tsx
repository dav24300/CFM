"use client";

import { Play, Square, Pencil, MessageSquare, History, BarChart3, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/primitives/button";
import { Input } from "@/components/ui/primitives/input";
import { Card } from "@/components/admin/ui/card";
import { StatusBadge } from "@/components/admin/ui/status-badge";
import { RowActionsMenu } from "@/components/admin/ui/dropdown-menu";
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
    <Card className="p-4 text-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <strong className="font-display text-admin-ink">{ev.title}</strong>
            <StatusBadge status={ev.status} />
            {pendingCount > 0 && (
              <span className="rounded-full bg-admin-warn-bg px-2 py-0.5 text-xs font-medium text-admin-warn-fg">
                {pendingCount} chat
              </span>
            )}
            <a
              href={`/live/${ev.slug}`}
              className="text-xs font-medium text-admin-accent hover:underline"
              target="_blank"
              rel="noreferrer"
            >
              Voir →
            </a>
          </div>
          {ev.thumbnail && (
            <p className="mt-1 truncate text-xs text-admin-muted-2">Miniature : {ev.thumbnail}</p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {ev.status === "scheduled" && (
            <Button type="button" size="sm" onClick={() => onSetStatus(ev.id, "live")}>
              <Play className="h-3.5 w-3.5" /> Démarrer
            </Button>
          )}
          {ev.status === "live" && (
            <Button type="button" size="sm" variant="secondary" onClick={() => onSetStatus(ev.id, "ended")}>
              <Square className="h-3.5 w-3.5" /> Terminer
            </Button>
          )}
          {(ev.status === "ended" || ev.status === "live") && (
            <Button type="button" size="sm" variant="secondary" onClick={() => onPublishReplay(ev)}>
              Publier replay
            </Button>
          )}
          <RowActionsMenu
            label="Actions du live"
            actions={[
              { label: "Modifier", icon: Pencil, onSelect: () => onEdit(ev.id) },
              { label: "Modérer le chat", icon: MessageSquare, onSelect: () => onModerateChat(ev.id) },
              { label: "Historique du chat", icon: History, onSelect: () => onAllChat(ev.id) },
              { label: "Sondages", icon: BarChart3, onSelect: () => onPolls(ev.id) },
              { label: "Miniature", icon: ImageIcon, onSelect: () => onThumbnail(ev.id) },
            ]}
          />
        </div>
      </div>
      <form
        onSubmit={(e) => onCreatePoll(e, ev.id)}
        className="mt-3 flex flex-wrap items-center gap-2 border-t border-admin-border pt-3"
      >
        <Input name="question" placeholder="Sondage…" className="min-w-[120px] flex-1 py-2 text-xs" />
        <Input name="opt1" placeholder="Option 1" className="w-24 py-2 text-xs" required />
        <Input name="opt2" placeholder="Option 2" className="w-24 py-2 text-xs" required />
        <Button type="submit" size="sm" variant="secondary">
          + Sondage
        </Button>
      </form>
    </Card>
  );
}
