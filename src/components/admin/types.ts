export type AdminAccess = "admin" | "volunteer";

export type AdminSection =
  | "overview"
  | "inbox"
  | "content"
  | "territory"
  | "community"
  | "donations"
  | "live"
  | "design"
  | "identity"
  | "pages"
  | "i18n"
  | "partners"
  | "audit";

export type AdminStats = {
  news: number;
  studies: number;
  campaigns: number;
  memberships: number;
  help_requests: number;
  newsletter: number;
  contacts: number;
  pending_memberships: number;
  new_help: number;
  users?: number;
  pending_users?: number;
  donations?: number;
  petitions?: number;
  family_links?: number;
  pending_family_links?: number;
  live_events?: number;
  pending_chat?: number;
};

export type AdminData = {
  memberships: Record<string, unknown>[];
  help_requests: Record<string, unknown>[];
  newsletter: Record<string, unknown>[];
  contacts: Record<string, unknown>[];
  news: Record<string, unknown>[];
  studies: Record<string, unknown>[];
  campaigns: Record<string, unknown>[];
  actions: Record<string, unknown>[];
  testimonials: Record<string, unknown>[];
  press_releases: Record<string, unknown>[];
  users?: Record<string, unknown>[];
  family_links?: Record<string, unknown>[];
  donations?: Record<string, unknown>[];
  petitions?: Record<string, unknown>[];
};
