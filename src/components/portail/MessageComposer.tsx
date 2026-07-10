"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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
      <input
        id="msg-subject"
        type="text"
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        placeholder="Sujet (facultatif)"
        className="mb-2 w-full border border-site-hairline bg-white px-3.5 py-2.5 text-sm text-site-ink outline-none placeholder:text-site-muted-2 focus:border-site-primary"
      />
      <label htmlFor="msg-body" className="sr-only">
        Votre message
      </label>
      <textarea
        id="msg-body"
        rows={3}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Votre message…"
        className="w-full resize-y border border-site-hairline bg-white px-3.5 py-2.5 text-sm leading-[1.5] text-site-ink outline-none placeholder:text-site-muted-2 focus:border-site-primary"
      />
      {error && <p className="mt-2 text-xs text-[#c0362c]">{error}</p>}
      <div className="mt-3 flex justify-end">
        <button
          type="submit"
          disabled={isSending || !body.trim()}
          className="bg-site-primary px-5 py-2.5 text-[13px] font-semibold text-white transition hover:bg-site-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSending ? "Envoi…" : "Envoyer"}
        </button>
      </div>
    </form>
  );
}
