"use client";

import { useEffect, useState } from "react";
import { MediaPicker } from "@/components/admin/ui/media-picker";
import { PreviewButton } from "@/components/admin/ui/preview-button";
import { SlideOverEditor, type EditorField } from "@/components/admin/ui/slide-over-editor";
import { LiveEventCard } from "@/components/admin/live/LiveEventCard";
import { ChatModerationSection } from "@/components/admin/live/ChatModerationSection";
import { PollsSection } from "@/components/admin/live/PollsSection";
import { PushNotificationForm } from "@/components/admin/live/PushNotificationForm";
import * as liveApi from "@/components/admin/hooks/live-admin-api";
import type {
  AdminLiveEvent,
  ChatMsg,
  LivePoll,
  ModerationStatus,
  PendingCount,
} from "@/components/admin/hooks/live-admin-api";

export type { AdminLiveEvent } from "@/components/admin/hooks/live-admin-api";

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

type ChatState = { pending: ChatMsg[]; history: ChatMsg[]; mode: "pending" | "all" };
const EMPTY_CHAT: ChatState = { pending: [], history: [], mode: "pending" };

export type AdminV3PanelProps = {
  initialEvents: AdminLiveEvent[];
  onReload: () => void;
};
type Props = AdminV3PanelProps;

export function AdminV3Panel({ initialEvents, onReload }: Props) {
  const [events, setEvents] = useState(initialEvents);
  const [pendingCounts, setPendingCounts] = useState<PendingCount[]>([]);
  const [editorOpen, setEditorOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<number | null>(null);
  const [editEventId, setEditEventId] = useState<number | null>(null);
  const [pushStats, setPushStats] = useState<number | null>(null);
  const [thumbEventId, setThumbEventId] = useState<number | null>(null);
  const [polls, setPolls] = useState<LivePoll[]>([]);
  const [chat, setChat] = useState<ChatState>(EMPTY_CHAT);

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function reload() {
    const bundle = await liveApi.fetchLiveEvents();
    if (bundle) {
      setEvents(bundle.events);
      setPendingCounts(bundle.pending);
    }
    const subscribers = await liveApi.fetchPushStats();
    if (subscribers !== null) setPushStats(subscribers);
    onReload();
  }

  async function handleEditorSubmit(values: Record<string, unknown>) {
    if (editEventId) {
      await liveApi.updateLiveEvent(editEventId, values);
    } else {
      await liveApi.createLiveEvent({
        title: values.title,
        description: values.description,
        youtube_id: values.youtube_id,
        chat_moderation: values.chat_moderation,
      });
    }
    setEditorOpen(false);
    setEditEventId(null);
    reload();
  }

  const editingEvent = editEventId ? events.find((e) => e.id === editEventId) ?? null : null;

  async function setStatus(id: number, status: string, replay_url?: string) {
    await liveApi.setLiveStatus(id, status, replay_url);
    reload();
  }

  function openEditor(id: number | null) {
    setEditEventId(id);
    setEditorOpen(true);
  }

  function publishReplay(ev: AdminLiveEvent) {
    if (ev.replay_url) setStatus(ev.id, "replay", ev.replay_url);
    else openEditor(ev.id);
  }

  async function moderateBulk(status: ModerationStatus) {
    await liveApi.moderateChatBulk(chat.pending, status);
    if (selectedEvent) loadPending(selectedEvent);
    reload();
  }

  async function loadPending(eventId: number) {
    setSelectedEvent(eventId);
    setChat((c) => ({ ...c, mode: "pending" }));
    const messages = await liveApi.loadPendingChat(eventId);
    if (messages) setChat((c) => ({ ...c, pending: messages, history: messages }));
  }

  async function loadAllChat(eventId: number) {
    setSelectedEvent(eventId);
    setChat((c) => ({ ...c, mode: "all" }));
    const messages = await liveApi.loadAllChat(eventId);
    if (messages) {
      setChat((c) => ({
        ...c,
        history: messages,
        pending: messages.filter((m) => m.status === "pending"),
      }));
    }
  }

  async function loadPolls(eventId: number) {
    setSelectedEvent(eventId);
    const loaded = await liveApi.loadPolls(eventId);
    if (loaded) setPolls(loaded);
  }

  async function closePoll(pollId: number) {
    await liveApi.closePoll(pollId);
    if (selectedEvent) loadPolls(selectedEvent);
  }

  async function moderate(messageId: number, status: ModerationStatus) {
    await liveApi.moderateChat(messageId, status);
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
    await liveApi.createPoll(event.slug, { question: fd.get("question"), options });
    e.currentTarget.reset();
  }

  async function setThumbnail(id: number, thumbnail: string) {
    await liveApi.setThumbnail(id, thumbnail);
    setThumbEventId(null);
    reload();
  }

  const showChat =
    chat.pending.length > 0 || (chat.mode === "all" && chat.history.length > 0);

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
              className="rounded-admin-ctrl bg-admin-accent px-3 py-1 text-sm font-semibold text-admin-accent-fg"
            >
              + Nouveau live
            </button>
          </div>
        </div>
        <div className="mt-4 space-y-3">
          {events.map((ev) => (
            <LiveEventCard
              key={ev.id}
              event={ev}
              pendingCount={pendingCounts.find((p) => p.eventId === ev.id)?.count || 0}
              onSetStatus={setStatus}
              onPublishReplay={publishReplay}
              onEdit={openEditor}
              onModerateChat={loadPending}
              onAllChat={loadAllChat}
              onPolls={loadPolls}
              onThumbnail={setThumbEventId}
              onCreatePoll={createPoll}
            />
          ))}
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

      {showChat && (
        <ChatModerationSection
          pending={chat.pending}
          chatHistory={chat.history}
          chatMode={chat.mode}
          onModerateBulk={moderateBulk}
          onModerate={moderate}
        />
      )}

      {polls.length > 0 && <PollsSection polls={polls} onClosePoll={closePoll} />}

      <PushNotificationForm onSend={liveApi.sendPush} />

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
