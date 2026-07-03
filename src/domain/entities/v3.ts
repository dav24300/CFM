export type LiveEventStatus = "scheduled" | "live" | "ended" | "replay";

export type LiveEvent = {
  id: number;
  title: string;
  slug: string;
  description: string;
  status: LiveEventStatus;
  youtube_id: string | null;
  stream_url: string | null;
  replay_url: string | null;
  chat_moderation: number;
  viewer_count: number;
  started_at: string | null;
  ended_at: string | null;
  thumbnail?: string | null;
  thumbnail_alt?: string | null;
  created_at: string;
};

export type LiveChatStatus = "pending" | "approved" | "rejected";

export type LiveChatMessage = {
  id: number;
  live_event_id: number;
  user_id: number | null;
  author_name: string;
  content: string;
  status: LiveChatStatus;
  created_at: string;
};

export type LivePollOption = {
  id: string;
  text: string;
  votes: number;
};

export type LivePoll = {
  id: number;
  live_event_id: number;
  question: string;
  options: LivePollOption[];
  active: number;
  created_at: string;
};

export type LivePollVote = {
  id: number;
  poll_id: number;
  option_id: string;
  voter_key: string;
  created_at: string;
};

export type PushTopic = "lives" | "campaigns" | "help";

export type PushSubscription = {
  id: number;
  endpoint: string;
  p256dh: string;
  auth: string;
  topics: PushTopic[];
  created_at: string;
};
