"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/primitives/button";
import { Input } from "@/components/ui/primitives/input";
import { Textarea } from "@/components/ui/primitives/textarea";
import { NativeSelect } from "@/components/ui/primitives/native-select";
import { MediaPicker } from "@/components/admin/ui/media-picker";
import { PreviewButton } from "@/components/admin/ui/preview-button";
import { SlideOverEditor, type EditorField } from "@/components/admin/ui/slide-over-editor";

const LIVE_CREATE_FIELDS: EditorField[] = [
  { name: "title", label: "Titre", type: "text", required: true, colSpan: 2 },
  { name: "description", label: "Description", type: "textarea", required: true, colSpan: 2, rows: 3 },
  { name: "youtube_id", label: "YouTube ID", type: "text", colSpan: 2, placeholder: "optionnel" },
  { name: "chat_moderation", label: "Modération chat active", type: "toggle", colSpan: 2 },
];

const LIVE_EDIT_FIELDS: EditorField[] = [
  { name: "title", label: "Titre", type: "text", required: true, colSpan: 2 },
  { name: "description", label: "Description", type: "textarea", colSpan: 2, rows: 3 },
  { name: "youtube_id", label: "YouTube ID", type: "text", colSpan: 1 },
  { name: "stream_url", label: "URL stream", type: "url", colSpan: 1 },
  { name: "replay_url", label: "URL replay", type: "url", colSpan: 2 },
];

const PUSH_TEMPLATES = [
  { label: "Live", topic: "lives", title: "🔴 Live CFM", body: "Rejoignez-nous en direct maintenant !" },
  { label: "Campagne", topic: "campaigns", title: "Nouvelle campagne CFM", body: "Découvrez notre action du moment sur le site." },
  { label: "Aide", topic: "help", title: "Mise à jour dossier", body: "Votre demande d'aide a été traitée." },
];

type LivePoll = {
  id: number;
  question: string;
  active: number;
  options: { id: string; text: string; votes: number }[];
};

type ChatMsg = {
  id: number;
  author_name: string;
  content: string;
  status: string;
  created_at?: string;
};

export type AdminLiveEvent = {
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
type LiveEvent = AdminLiveEvent;

type PendingCount = { eventId: number; count: number };

export type AdminV3PanelProps = {
  initialEvents: AdminLiveEvent[];
  onReload: () => void;
};
type Props = AdminV3PanelProps;

export function AdminV3Panel({ initialEvents, onReload }: Props) {
  const [events, setEvents] = useState(initialEvents);
  const [pendingCounts, setPendingCounts] = useState<PendingCount[]>([]);
  const [editorOpen, setEditorOpen] = useState(false);
  const [pending, setPending] = useState<ChatMsg[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<number | null>(null);
  const [editEventId, setEditEventId] = useState<number | null>(null);
  const [pushForm, setPushForm] = useState({ topic: "lives", title: "", body: "" });
  const [pushStats, setPushStats] = useState<number | null>(null);
  const [thumbEventId, setThumbEventId] = useState<number | null>(null);
  const [polls, setPolls] = useState<LivePoll[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatMsg[]>([]);
  const [chatMode, setChatMode] = useState<"pending" | "all">("pending");

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

  async function handleEditorSubmit(values: Record<string, unknown>) {
    if (editEventId) {
      await fetch(`/api/admin/live/${editEventId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: values.title,
          description: values.description,
          youtube_id: values.youtube_id || null,
          stream_url: values.stream_url || null,
          replay_url: values.replay_url || null,
        }),
      });
    } else {
      await fetch("/api/admin/live", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          title: values.title,
          description: values.description,
          youtube_id: values.youtube_id || undefined,
          chat_moderation: Boolean(values.chat_moderation),
        }),
      });
    }
    setEditorOpen(false);
    setEditEventId(null);
    reload();
  }

  const editingEvent = editEventId ? events.find((e) => e.id === editEventId) ?? null : null;

  async function setStatus(id: number, status: string, replay_url?: string) {
    await fetch("/api/admin/live", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "set_status", id, status, replay_url }),
    });
    reload();
  }

  function openEditor(id: number | null) {
    setEditEventId(id);
    setEditorOpen(true);
  }

  function publishReplay(ev: LiveEvent) {
    if (ev.replay_url) setStatus(ev.id, "replay", ev.replay_url);
    else openEditor(ev.id);
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
    setChatMode("pending");
    const res = await fetch("/api/admin/live", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "pending_chat", eventId }),
    });
    if (res.ok) {
      const data = await res.json();
      setPending(data.messages);
      setChatHistory(data.messages);
    }
  }

  async function loadAllChat(eventId: number) {
    setSelectedEvent(eventId);
    setChatMode("all");
    const res = await fetch("/api/admin/live", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "all_chat", eventId }),
    });
    if (res.ok) {
      const data = await res.json();
      setChatHistory(data.messages);
      setPending(data.messages.filter((m: ChatMsg) => m.status === "pending"));
    }
  }

  async function loadPolls(eventId: number) {
    setSelectedEvent(eventId);
    const res = await fetch("/api/admin/live", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "polls", eventId }),
    });
    if (res.ok) {
      const data = await res.json();
      setPolls(data.polls);
    }
  }

  async function closePoll(pollId: number) {
    await fetch(`/api/admin/live/polls/${pollId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: 0 }),
    });
    if (selectedEvent) loadPolls(selectedEvent);
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
          <div className="flex items-center gap-2">
            {pushStats !== null && (
              <span className="text-sm text-admin-muted">{pushStats} abonné(s) push</span>
            )}
            <PreviewButton href="/live" tags={["cfm:live"]} label="Voir sur le site" />
            <button
              type="button"
              onClick={() => openEditor(null)}
              className="rounded-admin-ctrl bg-admin-accent px-3 py-1 text-sm font-semibold text-white"
            >
              + Nouveau live
            </button>
          </div>
        </div>
        <div className="mt-4 space-y-3">
          {events.map((ev) => {
            const pendingN = pendingCounts.find((p) => p.eventId === ev.id)?.count || 0;
            return (
            <div key={ev.id} className="rounded-lg bg-admin-surface p-4 shadow text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <strong>{ev.title}</strong>
                  <span className="ml-2 text-admin-accent">{ev.status}</span>
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
                      onClick={() => publishReplay(ev)}
                      className="rounded bg-admin-deep px-2 py-1 text-xs text-white"
                    >
                      Publier replay
                    </button>
                  )}
                  <button type="button" onClick={() => openEditor(ev.id)} className="rounded border px-2 py-1 text-xs">
                    Modifier
                  </button>
                  <button type="button" onClick={() => loadPending(ev.id)} className="rounded border px-2 py-1 text-xs">
                    Modérer chat
                  </button>
                  <button type="button" onClick={() => loadAllChat(ev.id)} className="rounded border px-2 py-1 text-xs">
                    Historique chat
                  </button>
                  <button type="button" onClick={() => loadPolls(ev.id)} className="rounded border px-2 py-1 text-xs">
                    Sondages
                  </button>
                  <button type="button" onClick={() => setThumbEventId(ev.id)} className="rounded border px-2 py-1 text-xs">
                    Miniature
                  </button>
                </div>
              </div>
              {ev.thumbnail && (
                <p className="mt-1 truncate text-xs text-admin-muted">Miniature : {ev.thumbnail}</p>
              )}
              <form onSubmit={(e) => createPoll(e, ev.id)} className="mt-3 flex flex-wrap gap-2 border-t pt-3">
                <Input name="question" placeholder="Sondage…" className="flex-1 min-w-[120px] text-xs" />
                <Input name="opt1" placeholder="Option 1" className="w-24 text-xs" required />
                <Input name="opt2" placeholder="Option 2" className="w-24 text-xs" required />
                <button type="submit" className="rounded bg-admin-accent px-2 py-1 text-xs font-semibold text-admin-ink">
                  + Sondage
                </button>
              </form>
            </div>
          );
          })}
        </div>
      </section>

      <SlideOverEditor
        open={editorOpen}
        title={editEventId ? "Modifier le live" : "Nouveau live"}
        fields={editEventId ? LIVE_EDIT_FIELDS : LIVE_CREATE_FIELDS}
        initialValues={
          editingEvent
            ? {
                title: editingEvent.title,
                description: editingEvent.description || "",
                youtube_id: editingEvent.youtube_id || "",
                stream_url: editingEvent.stream_url || "",
                replay_url: editingEvent.replay_url || "",
              }
            : { chat_moderation: true }
        }
        onClose={() => {
          setEditorOpen(false);
          setEditEventId(null);
        }}
        onSubmit={handleEditorSubmit}
        preview={(v) => (
          <div className="font-display text-sm font-semibold text-admin-ink">
            {String(v.title || "Nouveau live")}
          </div>
        )}
      />

      {(pending.length > 0 || (chatMode === "all" && chatHistory.length > 0)) && (
        <section>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">
              {chatMode === "all"
                ? `Historique chat (${chatHistory.length})`
                : `Chat en attente (${pending.length})`}
            </h2>
            {chatMode === "pending" && pending.length > 0 && (
              <div className="flex gap-2">
                <button type="button" onClick={() => moderateBulk("approved")} className="rounded bg-green-600 px-2 py-1 text-xs text-white">
                  Tout approuver
                </button>
                <button type="button" onClick={() => moderateBulk("rejected")} className="rounded bg-red-600 px-2 py-1 text-xs text-white">
                  Tout refuser
                </button>
              </div>
            )}
          </div>
          <div className="mt-3 max-h-80 space-y-2 overflow-y-auto">
            {(chatMode === "all" ? chatHistory : pending).map((m) => (
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
                    <button type="button" onClick={() => moderate(m.id, "approved")} className="rounded bg-green-600 px-2 py-0.5 text-xs text-white">OK</button>
                    <button type="button" onClick={() => moderate(m.id, "rejected")} className="rounded bg-red-600 px-2 py-0.5 text-xs text-white">Refuser</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {polls.length > 0 && (
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
                    <button type="button" onClick={() => closePoll(poll.id)} className="rounded border px-2 py-1 text-xs">
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
      )}

      <section>
        <h2 className="text-lg font-bold">Notification push</h2>
        <div className="mt-2 flex flex-wrap gap-2">
          {PUSH_TEMPLATES.map((tpl) => (
            <button
              key={tpl.label}
              type="button"
              className="rounded border px-2 py-1 text-xs hover:bg-admin-bg"
              onClick={() => setPushForm({ topic: tpl.topic, title: tpl.title, body: tpl.body })}
            >
              {tpl.label}
            </button>
          ))}
        </div>
        <form onSubmit={sendPush} className="mt-3 space-y-2 rounded-xl bg-admin-surface p-4 shadow max-w-lg">
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
