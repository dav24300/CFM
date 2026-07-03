"use client";

import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/primitives/input";
import { Button } from "@/components/ui/primitives/button";
import { Alert } from "@/components/ui/primitives/alert";
import { EmptyState } from "@/components/ui/patterns/empty-state";

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

export function LiveChat({ slug, isLive, labels }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [content, setContent] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "pending" | "error">("idle");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/live/${slug}/chat`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages);
      }
    }
    load();
    const id = setInterval(load, 3000);
    return () => clearInterval(id);
  }, [slug]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
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
      const res2 = await fetch(`/api/live/${slug}/chat`);
      if (res2.ok) {
        const d = await res2.json();
        setMessages(d.messages);
      }
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="flex h-[400px] flex-col rounded-xl border border-cfm-gold/20 bg-white shadow">
      <div className="border-b border-gray-100 px-4 py-3 font-semibold text-cfm-navy">
        {labels.title}
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.length === 0 && (
          <EmptyState
            variant="compact"
            title={isLive ? "Soyez le premier à écrire…" : labels.closed}
          />
        )}
        {messages.map((m) => (
          <div key={m.id} className="text-sm">
            <span className="font-semibold text-cfm-gold">{m.author_name}</span>
            <span className="text-cfm-earth"> — {m.content}</span>
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
