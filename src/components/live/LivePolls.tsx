"use client";

import { useEffect, useState } from "react";

type PollOption = { id: string; text: string; votes: number };

type Poll = {
  id: number;
  question: string;
  options: PollOption[];
};

type Props = {
  slug: string;
  polls: Poll[];
  isLive: boolean;
  labels: { vote: string; voted: string };
};

/**
 * Les sondages sont créés par l'admin et leurs résultats tolèrent quelques
 * secondes de retard : 5 s × N spectateurs était du trafic gratuit.
 */
const POLL_REFRESH_MS = 15_000;

export function LivePolls({ slug, polls: initial, isLive, labels }: Props) {
  const [polls, setPolls] = useState(initial);
  const [voted, setVoted] = useState<Set<number>>(new Set());
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isLive) return;
    const controller = new AbortController();

    async function refresh() {
      try {
        const res = await fetch(`/api/live/${slug}/polls`, { signal: controller.signal });
        if (!res.ok) return;
        const data = await res.json();
        if (!Array.isArray(data.polls)) return;
        // Ne remplacer le state que si les résultats ont bougé : sinon chaque
        // tick recréait le tableau et re-rendait tous les sondages pour rien.
        setPolls((prev) =>
          JSON.stringify(prev) === JSON.stringify(data.polls) ? prev : data.polls
        );
      } catch {
        // annulé ou hors ligne : le tick suivant réessaiera
      }
    }

    refresh();
    let timer: ReturnType<typeof setInterval> | null = null;
    const stop = () => {
      if (timer !== null) {
        clearInterval(timer);
        timer = null;
      }
    };
    const start = () => {
      if (timer === null) timer = setInterval(refresh, POLL_REFRESH_MS);
    };
    const onVisibility = () => {
      if (document.hidden) {
        stop();
      } else {
        refresh();
        start();
      }
    };

    if (!document.hidden) start();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
      controller.abort();
    };
  }, [slug, isLive]);

  async function vote(pollId: number, optionId: string) {
    if (!isLive || voted.has(pollId)) return;
    setError("");
    try {
      const res = await fetch(`/api/live/${slug}/polls/${pollId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ optionId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPolls((prev) => prev.map((p) => (p.id === pollId ? data.poll : p)));
      setVoted((s) => new Set(s).add(pollId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    }
  }

  if (polls.length === 0) return null;

  const totalVotes = (opts: PollOption[]) =>
    opts.reduce((s, o) => s + o.votes, 0) || 1;

  return (
    <div className="space-y-4">
      {polls.map((poll) => (
        <div key={poll.id} className="card">
          <h3 className="font-semibold text-site-ink">{poll.question}</h3>
          <div className="mt-3 space-y-2">
            {poll.options.map((opt) => {
              const total = totalVotes(poll.options);
              const pct = Math.round((opt.votes / total) * 100);
              const hasVoted = voted.has(poll.id);
              return (
                <button
                  key={opt.id}
                  type="button"
                  disabled={!isLive || hasVoted}
                  onClick={() => vote(poll.id, opt.id)}
                  className="relative w-full overflow-hidden rounded-lg border border-gray-200 px-3 py-2 text-left text-sm disabled:cursor-default hover:border-site-primary disabled:hover:border-gray-200"
                >
                  <div
                    className="absolute inset-y-0 left-0 bg-site-primary/20"
                    style={{ width: `${hasVoted ? pct : 0}%` }}
                  />
                  <span className="relative flex justify-between">
                    <span>{opt.text}</span>
                    {hasVoted && <span className="text-site-primary">{pct}%</span>}
                  </span>
                </button>
              );
            })}
          </div>
          {voted.has(poll.id) && (
            <p className="mt-2 text-xs text-green-600">{labels.voted}</p>
          )}
        </div>
      ))}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
