"use client";

import type { ChatMsg, ModerationStatus } from "@/components/admin/hooks/live-admin-api";

type Props = {
  pending: ChatMsg[];
  chatHistory: ChatMsg[];
  chatMode: "pending" | "all";
  onModerateBulk: (status: ModerationStatus) => void;
  onModerate: (messageId: number, status: ModerationStatus) => void;
};

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
    <section>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">
          {chatMode === "all"
            ? `Historique chat (${chatHistory.length})`
            : `Chat en attente (${pending.length})`}
        </h2>
        {chatMode === "pending" && pending.length > 0 && (
          <div className="flex gap-2">
            <button type="button" onClick={() => onModerateBulk("approved")} className="rounded bg-green-600 px-2 py-1 text-xs text-white">
              Tout approuver
            </button>
            <button type="button" onClick={() => onModerateBulk("rejected")} className="rounded bg-red-600 px-2 py-1 text-xs text-white">
              Tout refuser
            </button>
          </div>
        )}
      </div>
      <div className="mt-3 max-h-80 space-y-2 overflow-y-auto">
        {visible.map((m) => (
          <div
            key={m.id}
            className={`flex justify-between gap-2 rounded-lg p-3 text-sm ${
              m.status === "pending" ? "bg-amber-50" : m.status === "rejected" ? "bg-red-50" : "bg-admin-bg"
            }`}
          >
            <span>
              <strong>{m.author_name}</strong>
              <span className="ml-2 text-xs text-admin-muted">{m.status}</span>
              <br />
              {m.content}
            </span>
            {m.status === "pending" && (
              <div className="flex gap-1 shrink-0">
                <button type="button" onClick={() => onModerate(m.id, "approved")} className="rounded bg-green-600 px-2 py-0.5 text-xs text-white">OK</button>
                <button type="button" onClick={() => onModerate(m.id, "rejected")} className="rounded bg-red-600 px-2 py-0.5 text-xs text-white">Refuser</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
