"use client";

import { useState } from "react";
import { Button } from "@/components/ui/primitives/button";
import { Input } from "@/components/ui/primitives/input";
import { Textarea } from "@/components/ui/primitives/textarea";
import { NativeSelect } from "@/components/ui/primitives/native-select";

type LiveEvent = {
  id: number;
  title: string;
  slug: string;
  status: string;
  viewer_count: number;
  chat_moderation: number;
};

type PendingMsg = {
  id: number;
  author_name: string;
  content: string;
};

type Props = {
  initialEvents: LiveEvent[];
  onReload: () => void;
};

export function AdminV3Panel({ initialEvents, onReload }: Props) {
  const [events, setEvents] = useState(initialEvents);
  const [showForm, setShowForm] = useState(false);
  const [pending, setPending] = useState<PendingMsg[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<number | null>(null);
  const [pushForm, setPushForm] = useState({ topic: "lives", title: "", body: "" });

  async function reload() {
    const res = await fetch("/api/admin/live");
    if (res.ok) {
      const data = await res.json();
      setEvents(data.events);
    }
    onReload();
  }

  async function createEvent(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    await fetch("/api/admin/live", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "create",
        title: fd.get("title"),
        description: fd.get("description"),
        youtube_id: fd.get("youtube_id") || undefined,
        chat_moderation: fd.get("chat_moderation") === "on",
      }),
    });
    setShowForm(false);
    reload();
  }

  async function setStatus(id: number, status: string, replay_url?: string) {
    await fetch("/api/admin/live", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "set_status", id, status, replay_url }),
    });
    reload();
  }

  function publishReplay(id: number) {
    const url = window.prompt("URL du replay (YouTube, etc.)", "https://youtube.com/@cfmasbl");
    if (url) setStatus(id, "replay", url);
  }

  async function loadPending(eventId: number) {
    setSelectedEvent(eventId);
    const res = await fetch("/api/admin/live", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "pending_chat", eventId }),
    });
    if (res.ok) {
      const data = await res.json();
      setPending(data.messages);
    }
  }

  async function moderate(messageId: number, status: "approved" | "rejected") {
    await fetch("/api/live/chat/moderate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messageId, status }),
    });
    if (selectedEvent) loadPending(selectedEvent);
  }

  async function createPoll(e: React.FormEvent<HTMLFormElement>, eventId: number) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const event = events.find((ev) => ev.id === eventId);
    if (!event) return;
    const options = [fd.get("opt1"), fd.get("opt2"), fd.get("opt3")]
      .filter(Boolean)
      .map(String);
    await fetch(`/api/live/${event.slug}/polls`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: fd.get("question"), options }),
    });
    e.currentTarget.reset();
  }

  async function sendPush(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/admin/live", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "send_push", ...pushForm }),
    });
    setPushForm({ topic: "lives", title: "", body: "" });
  }

  return (
    <div className="mt-8 space-y-10">
      <section>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Lives & événements ({events.length})</h2>
          <button
            type="button"
            onClick={() => setShowForm(!showForm)}
            className="rounded-lg bg-cfm-gold px-3 py-1 text-sm font-semibold text-cfm-navy"
          >
            + Nouveau live
          </button>
        </div>
        {showForm && (
          <form onSubmit={createEvent} className="mt-4 space-y-3 rounded-xl bg-white p-4 shadow">
            <Input name="title" placeholder="Titre" required />
            <Textarea name="description" placeholder="Description" required rows={2} />
            <Input name="youtube_id" placeholder="YouTube ID (optionnel)" />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="chat_moderation" defaultChecked />
              Modération chat active
            </label>
            <Button type="submit" size="sm">Créer</Button>
          </form>
        )}
        <div className="mt-4 space-y-3">
          {events.map((ev) => (
            <div key={ev.id} className="rounded-lg bg-white p-4 shadow text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <strong>{ev.title}</strong>
                  <span className="ml-2 text-cfm-gold">{ev.status}</span>
                  <a href={`/live/${ev.slug}`} className="ml-2 text-xs text-blue-600 hover:underline" target="_blank" rel="noreferrer">
                    Voir →
                  </a>
                </div>
                <div className="flex flex-wrap gap-2">
                  {ev.status === "scheduled" && (
                    <button type="button" onClick={() => setStatus(ev.id, "live")} className="rounded bg-red-600 px-2 py-1 text-xs text-white">
                      Démarrer live
                    </button>
                  )}
                  {ev.status === "live" && (
                    <button type="button" onClick={() => setStatus(ev.id, "ended")} className="rounded bg-gray-600 px-2 py-1 text-xs text-white">
                      Terminer
                    </button>
                  )}
                  {(ev.status === "ended" || ev.status === "live") && (
                    <button
                      type="button"
                      onClick={() => publishReplay(ev.id)}
                      className="rounded bg-cfm-navy px-2 py-1 text-xs text-white"
                    >
                      Publier replay
                    </button>
                  )}
                  <button type="button" onClick={() => loadPending(ev.id)} className="rounded border px-2 py-1 text-xs">
                    Modérer chat
                  </button>
                </div>
              </div>
              <form onSubmit={(e) => createPoll(e, ev.id)} className="mt-3 flex flex-wrap gap-2 border-t pt-3">
                <Input name="question" placeholder="Sondage…" className="flex-1 min-w-[120px] text-xs" />
                <Input name="opt1" placeholder="Option 1" className="w-24 text-xs" required />
                <Input name="opt2" placeholder="Option 2" className="w-24 text-xs" required />
                <button type="submit" className="rounded bg-cfm-gold px-2 py-1 text-xs font-semibold text-cfm-navy">
                  + Sondage
                </button>
              </form>
            </div>
          ))}
        </div>
      </section>

      {pending.length > 0 && (
        <section>
          <h2 className="text-lg font-bold">Chat en attente ({pending.length})</h2>
          <div className="mt-3 space-y-2">
            {pending.map((m) => (
              <div key={m.id} className="flex justify-between gap-2 rounded-lg bg-amber-50 p-3 text-sm">
                <span><strong>{m.author_name}:</strong> {m.content}</span>
                <div className="flex gap-1 shrink-0">
                  <button type="button" onClick={() => moderate(m.id, "approved")} className="rounded bg-green-600 px-2 py-0.5 text-xs text-white">OK</button>
                  <button type="button" onClick={() => moderate(m.id, "rejected")} className="rounded bg-red-600 px-2 py-0.5 text-xs text-white">Refuser</button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-lg font-bold">Notification push</h2>
        <form onSubmit={sendPush} className="mt-3 space-y-2 rounded-xl bg-white p-4 shadow max-w-lg">
          <NativeSelect value={pushForm.topic} onChange={(e) => setPushForm({ ...pushForm, topic: e.target.value })} className="text-sm">
            <option value="lives">Lives</option>
            <option value="campaigns">Campagnes</option>
            <option value="help">Aide / dossiers</option>
          </NativeSelect>
          <Input value={pushForm.title} onChange={(e) => setPushForm({ ...pushForm, title: e.target.value })} placeholder="Titre" required className="text-sm" />
          <Textarea value={pushForm.body} onChange={(e) => setPushForm({ ...pushForm, body: e.target.value })} placeholder="Message" required className="text-sm" rows={2} />
          <Button type="submit" size="sm">Envoyer</Button>
        </form>
      </section>
    </div>
  );
}
