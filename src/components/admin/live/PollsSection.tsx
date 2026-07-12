"use client";

import type { LivePoll } from "@/components/admin/hooks/live-admin-api";

type Props = {
  polls: LivePoll[];
  onClosePoll: (pollId: number) => void;
};

/** Liste des sondages d'un événement + export CSV. */
export function PollsSection({ polls, onClosePoll }: Props) {
  return (
    <section>
      <h2 className="text-lg font-bold">Sondages ({polls.length})</h2>
      <div className="mt-3 space-y-3">
        {polls.map((poll) => (
          <div key={poll.id} className="rounded-lg bg-admin-surface p-4 shadow text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <strong>{poll.question}</strong>
              <span className="text-xs text-admin-muted">{poll.active ? "Ouvert" : "Fermé"}</span>
            </div>
            <ul className="mt-2 space-y-1 text-admin-muted">
              {poll.options.map((o) => (
                <li key={o.id}>
                  {o.text} — <strong>{o.votes}</strong> vote(s)
                </li>
              ))}
            </ul>
            <div className="mt-2 flex gap-2">
              {poll.active === 1 && (
                <button type="button" onClick={() => onClosePoll(poll.id)} className="rounded border px-2 py-1 text-xs">
                  Fermer
                </button>
              )}
              <a
                href={`/api/admin/live/polls/${poll.id}?format=csv`}
                download
                className="rounded border px-2 py-1 text-xs hover:bg-admin-bg"
              >
                Export CSV
              </a>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
