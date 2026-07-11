"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/primitives/input";
import { Textarea } from "@/components/ui/primitives/textarea";
import { Button } from "@/components/ui/primitives/button";

export function MessageComposer() {
  const router = useRouter();
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = body.trim();
    if (!text || isSending) return;
    setIsSending(true);
    setError(null);
    try {
      const res = await fetch("/api/member/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: subject.trim() || undefined, body: text }),
      });
      if (!res.ok) throw new Error("send_failed");
      setSubject("");
      setBody("");
      router.refresh();
    } catch {
      setError("L’envoi a échoué. Veuillez réessayer.");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="border border-site-hairline bg-white p-4">
      <label htmlFor="msg-subject" className="sr-only">
        Sujet
      </label>
      <Input
        id="msg-subject"
        type="text"
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        placeholder="Sujet (facultatif)"
        className="mb-2 px-3.5 py-2.5 text-sm"
      />
      <label htmlFor="msg-body" className="sr-only">
        Votre message
      </label>
      <Textarea
        id="msg-body"
        rows={3}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Votre message…"
        className="resize-y px-3.5 py-2.5 text-sm leading-[1.5]"
      />
      {error && <p className="mt-2 text-xs text-site-danger">{error}</p>}
      <div className="mt-3 flex justify-end">
        <Button type="submit" size="sm" disabled={isSending || !body.trim()}>
          {isSending ? "Envoi…" : "Envoyer"}
        </Button>
      </div>
    </form>
  );
}
