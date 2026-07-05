"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/primitives/button";
import { Input } from "@/components/ui/primitives/input";
import { Textarea } from "@/components/ui/primitives/textarea";
import { NativeSelect } from "@/components/ui/primitives/native-select";
import { MediaPicker } from "@/components/admin/ui/media-picker";

type LiveEvent = {
  id: number;
  title: string;
  slug: string;
  status: string;
  viewer_count: number;
  chat_moderation: number;
  thumbnail?: string | null;
  replay_url?: string | null;
  stream_url?: string | null;
  youtube_id?: string | null;
  description?: string;
};

type PendingCount = { eventId: number; count: number };

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
  const [pendingCounts, setPendingCounts] = useState<PendingCount[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [pending, setPending] = useState<PendingMsg[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<number | null>(null);
  const [editEventId, setEditEventId] = useState<number | null>(null);
  const [replayUrl, setReplayUrl] = useState("");
  const [pushForm, setPushForm] = useState({ topic: "lives", title: "", body: "" });
  const [pushStats, setPushStats] = useState<number | null>(null);
  const [thumbEventId, setThumbEventId] = useState<number | null>(null);

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function reload() {
    const res = await fetch("/api/admin/live");
    if (res.ok) {
      const data = await res.json();
      setEvents(data.events);
      setPendingCounts(data.pending || []);
    }
    const statsRes = await fetch("/api/admin/live", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "stats" }),
    });
    if (statsRes.ok) {
      const stats = await statsRes.json();
      setPushStats(stats.push_subscribers ?? 0);
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
    const ev = events.find((e) => e.id === id);
    const url = replayUrl.trim() || ev?.replay_url || "";
    if (!url) return;
    setStatus(id, "replay", url);
    setReplayUrl("");
    setEditEventId(null);
  }

  async function saveEventEdit(e: React.FormEvent<HTMLFormElement>, id: number) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    await fetch(`/api/admin/live/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: fd.get("title"),
        description: fd.get("description"),
        youtube_id: fd.get("youtube_id") || null,
        stream_url: fd.get("stream_url") || null,
        replay_url: fd.get("replay_url") || null,
      }),
    });
    setEditEventId(null);
    reload();
  }

  async function moderateBulk(status: "approved" | "rejected") {
    for (const m of pending) {
      await fetch("/api/live/chat/moderate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId: m.id, status }),
      });
    }
    if (selectedEvent) loadPending(selectedEvent);
    reload();
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

  async function setThumbnail(id: number, thumbnail: string) {
    await fetch("/api/admin/live", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "set_thumbnail", id, thumbnail }),
    });
    setThumbEventId(null);
    reload();
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
          {pushStats !== null && (
            <span className="text-sm text-cfm-earth">{pushStats} abonné(s) push</span>
          )}
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
          {events.map((ev) => {
            const pendingN = pendingCounts.find((p) => p.eventId === ev.id)?.count || 0;
            return (
            <div key={ev.id} className="rounded-lg bg-white p-4 shadow text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <strong>{ev.title}</strong>
                  <span className="ml-2 text-cfm-gold">{ev.status}</span>
                  {pendingN > 0 && (
                    <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800">
                      {pendingN} chat
                    </span>
                  )}
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
                      onClick={() => {
                        setEditEventId(ev.id);
                        setReplayUrl(ev.replay_url || "");
                      }}
                      className="rounded bg-cfm-navy px-2 py-1 text-xs text-white"
                    >
                      Publier replay
                    </button>
                  )}
                  <button type="button" onClick={() => setEditEventId(ev.id)} className="rounded border px-2 py-1 text-xs">
                    Éditer
                  </button>
                  <button type="button" onClick={() => loadPending(ev.id)} className="rounded border px-2 py-1 text-xs">
                    Modérer chat
                  </button>
                  <button type="button" onClick={() => setThumbEventId(ev.id)} className="rounded border px-2 py-1 text-xs">
                    Miniature
                  </button>
                </div>
              </div>
              {ev.thumbnail && (
                <p className="mt-1 truncate text-xs text-gray-500">Miniature : {ev.thumbnail}</p>
              )}
              <form onSubmit={(e) => createPoll(e, ev.id)} className="mt-3 flex flex-wrap gap-2 border-t pt-3">
                <Input name="question" placeholder="Sondage…" className="flex-1 min-w-[120px] text-xs" />
                <Input name="opt1" placeholder="Option 1" className="w-24 text-xs" required />
                <Input name="opt2" placeholder="Option 2" className="w-24 text-xs" required />
                <button type="submit" className="rounded bg-cfm-gold px-2 py-1 text-xs font-semibold text-cfm-navy">
                  + Sondage
                </button>
              </form>
              {editEventId === ev.id && (
                <form onSubmit={(e) => saveEventEdit(e, ev.id)} className="mt-3 space-y-2 border-t pt-3">
                  <Input name="title" defaultValue={ev.title} placeholder="Titre" required className="text-xs" />
                  <Textarea name="description" defaultValue={ev.description || ""} placeholder="Description" rows={2} className="text-xs" />
                  <Input name="youtube_id" defaultValue={ev.youtube_id || ""} placeholder="YouTube ID" className="text-xs" />
                  <Input name="stream_url" defaultValue={ev.stream_url || ""} placeholder="URL stream" className="text-xs" />
                  <Input name="replay_url" defaultValue={ev.replay_url || replayUrl} placeholder="URL replay" className="text-xs" />
                  <div className="flex gap-2">
                    <Button type="submit" size="sm">Enregistrer</Button>
                    <Button type="button" size="sm" variant="ghost" onClick={() => setEditEventId(null)}>Annuler</Button>
                    {(ev.status === "ended" || ev.status === "live") && (
                      <Button type="button" size="sm" variant="secondary" onClick={() => publishReplay(ev.id)}>
                        Mettre en replay
                      </Button>
                    )}
                  </div>
                </form>
              )}
            </div>
          );
          })}
        </div>
      </section>

      {pending.length > 0 && (
        <section>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">Chat en attente ({pending.length})</h2>
            <div className="flex gap-2">
              <button type="button" onClick={() => moderateBulk("approved")} className="rounded bg-green-600 px-2 py-1 text-xs text-white">
                Tout approuver
              </button>
              <button type="button" onClick={() => moderateBulk("rejected")} className="rounded bg-red-600 px-2 py-1 text-xs text-white">
                Tout refuser
              </button>
            </div>
          </div>
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

      {thumbEventId !== null && (
        <MediaPicker
          open
          onClose={() => setThumbEventId(null)}
          onSelect={(path) => setThumbnail(thumbEventId, path)}
          title="Miniature du live"
          accept="image/*"
        />
      )}
    </div>
  );
}
