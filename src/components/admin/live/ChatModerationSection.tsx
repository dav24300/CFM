"use client";

import { cn } from "@/lib/utils/cn";
import { Card, CardHeader } from "@/components/admin/ui/card";
import type { ChatMsg, ModerationStatus } from "@/components/admin/hooks/live-admin-api";

type Props = {
  pending: ChatMsg[];
  chatHistory: ChatMsg[];
  chatMode: "pending" | "all";
  onModerateBulk: (status: ModerationStatus) => void;
  onModerate: (messageId: number, status: ModerationStatus) => void;
};

const softOk =
  "rounded-admin-ctrl bg-admin-ok-bg px-2.5 py-1 text-xs font-semibold text-admin-ok-fg transition-colors hover:bg-admin-ok-fg/15";
const softDanger =
  "rounded-admin-ctrl bg-admin-danger-bg px-2.5 py-1 text-xs font-semibold text-admin-danger-fg transition-colors hover:bg-admin-danger-fg/15";

/** Section de modération / historique du chat live. */
export function ChatModerationSection({
  pending,
  chatHistory,
  chatMode,
  onModerateBulk,
  onModerate,
}: Props) {
  const visible = chatMode === "all" ? chatHistory : pending;

  return (
    <Card className="p-4">
      <CardHeader
        title={
          chatMode === "all"
            ? `Historique du chat (${chatHistory.length})`
            : `Chat en attente (${pending.length})`
        }
        action={
          chatMode === "pending" && pending.length > 0 ? (
            <div className="flex gap-2">
              <button type="button" onClick={() => onModerateBulk("approved")} className={softOk}>
                Tout approuver
              </button>
              <button type="button" onClick={() => onModerateBulk("rejected")} className={softDanger}>
                Tout refuser
              </button>
            </div>
          ) : undefined
        }
      />
      <div className="mt-4 max-h-80 space-y-2 overflow-y-auto">
        {visible.map((m) => (
          <div
            key={m.id}
            className={cn(
              "flex justify-between gap-2 rounded-admin-ctrl border p-3 text-sm",
              m.status === "pending"
                ? "border-admin-warn-fg/20 bg-admin-warn-bg"
                : m.status === "rejected"
                  ? "border-admin-danger-fg/20 bg-admin-danger-bg"
                  : "border-admin-border bg-admin-bg"
            )}
          >
            <span className="min-w-0">
              <strong className="text-admin-ink">{m.author_name}</strong>
              <span className="ml-2 text-xs text-admin-muted-2">{m.status}</span>
              <br />
              <span className="text-admin-ink">{m.content}</span>
            </span>
            {m.status === "pending" && (
              <div className="flex shrink-0 gap-1">
                <button type="button" onClick={() => onModerate(m.id, "approved")} className={cn(softOk, "px-2 py-0.5")}>
                  OK
                </button>
                <button type="button" onClick={() => onModerate(m.id, "rejected")} className={cn(softDanger, "px-2 py-0.5")}>
                  Refuser
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}
