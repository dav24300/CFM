"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/primitives/input";
import { Button } from "@/components/ui/primitives/button";
import { Alert } from "@/components/ui/primitives/alert";
import { EmptyState } from "@/components/ui/patterns/empty-state";
import { isLiveRealtimeEnabled, useLiveChannel } from "@/lib/hooks/use-live-channel";

type Message = {
  id: number;
  author_name: string;
  content: string;
  created_at: string;
};

type Props = {
  slug: string;
  isLive: boolean;
  labels: {
    title: string;
    placeholder: string;
    send: string;
    pending: string;
    closed: string;
  };
};

/** Repli quand Pusher n'est pas configuré. 3 s × N spectateurs = charge inutile. */
const POLL_INTERVAL_MS = 10_000;
/** Périodicité d'un rechargement complet, pour refléter les modérations. */
const FULL_RELOAD_EVERY = 6;

export function LiveChat({ slug, isLive, labels }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [content, setContent] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "pending" | "error">("idle");
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastIdRef = useRef(0);
  const tickRef = useRef(0);
  const realtime = isLiveRealtimeEnabled();

  const loadMessages = useCallback(
    async (mode: "full" | "delta" = "full", signal?: AbortSignal) => {
      const useDelta = mode === "delta" && lastIdRef.current > 0;
      const url = useDelta
        ? `/api/live/${slug}/chat?since=${lastIdRef.current}`
        : `/api/live/${slug}/chat`;
      try {
        const res = await fetch(url, { signal });
        if (!res.ok) return;
        const data = await res.json();
        const incoming: Message[] = Array.isArray(data.messages) ? data.messages : [];

        if (useDelta) {
          // Rien de neuf : aucun setState, donc aucun re-render ni scroll forcé.
          if (incoming.length === 0) return;
          setMessages((prev) => {
            const seen = new Set(prev.map((m) => m.id));
            const fresh = incoming.filter((m) => !seen.has(m.id));
            return fresh.length ? [...prev, ...fresh] : prev;
          });
        } else {
          setMessages(incoming);
        }

        for (const m of incoming) {
          if (m.id > lastIdRef.current) lastIdRef.current = m.id;
        }
      } catch {
        // requête annulée ou réseau indisponible : le tick suivant réessaiera
      }
    },
    [slug]
  );

  useEffect(() => {
    lastIdRef.current = 0;
    tickRef.current = 0;
    const controller = new AbortController();
    loadMessages("full", controller.signal);

    // Pusher actif ou événement terminé (replay) : aucun polling à faire.
    if (realtime || !isLive) return () => controller.abort();

    let timer: ReturnType<typeof setInterval> | null = null;
    const stop = () => {
      if (timer !== null) {
        clearInterval(timer);
        timer = null;
      }
    };
    const start = () => {
      if (timer !== null) return;
      timer = setInterval(() => {
        tickRef.current += 1;
        const mode = tickRef.current % FULL_RELOAD_EVERY === 0 ? "full" : "delta";
        loadMessages(mode, controller.signal);
      }, POLL_INTERVAL_MS);
    };
    // Un onglet en arrière-plan n'a aucune raison d'interroger le serveur.
    const onVisibility = () => {
      if (document.hidden) {
        stop();
      } else {
        loadMessages("delta", controller.signal);
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
  }, [slug, realtime, isLive, loadMessages]);

  useLiveChannel(slug, isLive && realtime, {
    onChat: ({ message }) => {
      if (message.status && message.status !== "approved") return;
      setMessages((prev) => {
        if (prev.some((m) => m.id === message.id)) return prev;
        // Ajout en FIN de liste : la liste est chronologique (plus ancien en
        // haut) et le scroll suit le bas. L'insertion en tête plaçait les
        // messages temps réel à l'opposé de ceux du polling.
        return [...prev, message];
      });
      if (message.id > lastIdRef.current) lastIdRef.current = message.id;
    },
    onModeration: () => {
      loadMessages("full");
    },
  });

  useEffect(() => {
    // Ne suivre le flux que si l'utilisateur est déjà en bas : sinon on lui
    // arrache l'historique qu'il est en train de relire.
    const el = scrollRef.current;
    const nearBottom =
      !el || el.scrollHeight - el.scrollTop - el.clientHeight < 120;
    if (nearBottom) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim() || !isLive) return;
    setStatus("loading");
    try {
      const res = await fetch(`/api/live/${slug}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setContent("");
      setStatus(data.pending ? "pending" : "idle");
      if (!realtime || !data.pending) await loadMessages("delta");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="flex h-[400px] flex-col rounded-xl border border-site-primary/20 bg-white shadow">
      <div className="border-b border-gray-100 px-4 py-3 font-semibold text-site-ink">
        {labels.title}
        {realtime && isLive && (
          <span className="ml-2 text-xs font-normal text-green-600">● temps réel</span>
        )}
      </div>
      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.length === 0 && (
          <EmptyState
            variant="compact"
            title={isLive ? "Soyez le premier à écrire…" : labels.closed}
          />
        )}
        {messages.map((m) => (
          <div key={m.id} className="text-sm">
            <span className="font-semibold text-site-primary">{m.author_name}</span>
            <span className="text-site-muted"> — {m.content}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      {isLive ? (
        <form onSubmit={handleSubmit} className="flex gap-2 border-t border-gray-100 p-3">
          <Input
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={labels.placeholder}
            className="flex-1 text-sm"
            maxLength={500}
            aria-label={labels.placeholder}
          />
          <Button type="submit" size="sm" loading={status === "loading"}>
            {labels.send}
          </Button>
        </form>
      ) : (
        <p className="border-t border-gray-100 p-3 text-center text-xs text-gray-500">
          {labels.closed}
        </p>
      )}
      {status === "pending" && (
        <Alert variant="warning" className="mx-3 mb-2 text-xs">
          {labels.pending}
        </Alert>
      )}
      {status === "error" && (
        <Alert variant="error" className="mx-3 mb-2 text-xs">
          Erreur d&apos;envoi
        </Alert>
      )}
    </div>
  );
}
