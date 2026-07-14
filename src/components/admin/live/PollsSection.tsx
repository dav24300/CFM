"use client";

import { Button } from "@/components/ui/primitives/button";
import { Card } from "@/components/admin/ui/card";
import type { LivePoll } from "@/components/admin/hooks/live-admin-api";

type Props = {
  polls: LivePoll[];
  onClosePoll: (pollId: number) => void;
};

/** Liste des sondages d'un événement + export CSV. */
export function PollsSection({ polls, onClosePoll }: Props) {
  return (
    <div className="space-y-3">
      <h2 className="font-display text-admin-h3 font-semibold text-admin-ink">Sondages ({polls.length})</h2>
      <div className="space-y-3">
        {polls.map((poll) => (
          <Card key={poll.id} className="p-4 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <strong className="font-display text-admin-ink">{poll.question}</strong>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                  poll.active ? "bg-admin-ok-bg text-admin-ok-fg" : "bg-admin-bg text-admin-muted-2"
                }`}
              >
                {poll.active ? "Ouvert" : "Fermé"}
              </span>
            </div>
            <ul className="mt-2 space-y-1 text-admin-muted">
              {poll.options.map((o) => (
                <li key={o.id}>
                  {o.text} — <strong className="text-admin-ink">{o.votes}</strong> vote(s)
                </li>
              ))}
            </ul>
            <div className="mt-3 flex gap-2">
              {poll.active === 1 && (
                <Button type="button" size="sm" variant="secondary" onClick={() => onClosePoll(poll.id)}>
                  Fermer
                </Button>
              )}
              <a
                href={`/api/admin/live/polls/${poll.id}?format=csv`}
                download
                className="inline-flex items-center rounded-admin-ctrl border border-admin-border px-3 py-2 text-sm font-medium text-admin-muted transition-colors hover:bg-admin-bg hover:text-admin-ink"
              >
                Export CSV
              </a>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
