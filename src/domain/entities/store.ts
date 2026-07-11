import type {
  User,
  FamilyLink,
  Donation,
  Petition,
  PetitionSignature,
  HelpRequestUpdate,
  PasswordResetToken,
} from "@/domain/entities/v2";
import type {
  LiveEvent,
  LiveChatMessage,
  LivePoll,
  LivePollVote,
  PushSubscription,
} from "@/domain/entities/v3";
import type {
  News,
  Study,
  Campaign,
  Partner,
  Testimonial,
  Action,
  PressRelease,
} from "@/domain/entities/content";
import type {
  PortalEvent,
  MemberMessage,
  MemberResource,
} from "@/domain/entities/v4";

export type Store = {
  _counters: Record<string, number>;
  /** Version des seeds one-shot appliqués (store-seed.ts) ; absent = jamais stampé. */
  _seed_version?: number;
  news: News[];
  studies: Study[];
  campaigns: Campaign[];
  partners: Partner[];
  testimonials: Testimonial[];
  actions: Action[];
  memberships: Record<string, unknown>[];
  help_requests: Record<string, unknown>[];
  newsletter: { id: number; email: string; created_at: string }[];
  contact_messages: Record<string, unknown>[];
  press_releases: PressRelease[];
  site_settings: Record<string, string>;
  users: User[];
  family_links: FamilyLink[];
  donations: Donation[];
  petitions: Petition[];
  petition_signatures: PetitionSignature[];
  help_request_updates: HelpRequestUpdate[];
  password_reset_tokens: PasswordResetToken[];
  live_events: LiveEvent[];
  live_chat_messages: LiveChatMessage[];
  live_polls: LivePoll[];
  live_poll_votes: LivePollVote[];
  push_subscriptions: PushSubscription[];
  // Portail membre (Phase 3)
  events: PortalEvent[];
  member_messages: MemberMessage[];
  member_resources: MemberResource[];
};
