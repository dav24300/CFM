import { z } from "@/lib/validators";

export const adminNewsCreateSchema = z.object({
  title: z.string().trim().min(1),
  content: z.string().trim().min(1),
  slug: z.string().trim().optional(),
  excerpt: z.string().optional(),
  category: z.string().optional(),
  cover_image: z.string().optional(),
  cover_image_alt: z.string().optional(),
});

export const adminNewsPatchSchema = z.object({
  title: z.string().trim().min(1).optional(),
  content: z.string().trim().min(1).optional(),
  slug: z.string().trim().optional(),
  excerpt: z.string().optional(),
  category: z.string().optional(),
  cover_image: z.string().optional(),
  cover_image_alt: z.string().optional(),
  published: z.union([z.literal(0), z.literal(1)]).optional(),
});

export const adminStudyCreateSchema = z.object({
  title: z.string().trim().min(1),
  content: z.string().trim().min(1),
  slug: z.string().trim().optional(),
  summary: z.string().optional(),
  file_url: z.string().optional(),
});

export const adminStudyPatchSchema = adminStudyCreateSchema.partial().extend({
  published: z.union([z.literal(0), z.literal(1)]).optional(),
});

export const adminCampaignCreateSchema = z.object({
  title: z.string().trim().min(1),
  content: z.string().trim().min(1),
  slug: z.string().trim().optional(),
  image_url: z.string().optional(),
  petition_slug: z.string().optional(),
});

export const adminCampaignPatchSchema = adminCampaignCreateSchema.partial().extend({
  active: z.union([z.literal(0), z.literal(1)]).optional(),
});

export const adminPressCreateSchema = z.object({
  title: z.string().trim().min(1),
  content: z.string().trim().min(1),
  slug: z.string().trim().optional(),
  file_url: z.string().optional(),
});

export const adminPressPatchSchema = adminPressCreateSchema.partial().extend({
  published: z.union([z.literal(0), z.literal(1)]).optional(),
});

export const adminTestimonialCreateSchema = z.object({
  author: z.string().trim().min(1),
  role: z.string().optional(),
  content: z.string().trim().min(1),
  photo: z.string().optional(),
  anonymous: z.union([z.literal(0), z.literal(1), z.literal("0"), z.literal("1")]).optional(),
});

export const adminTestimonialPatchSchema = adminTestimonialCreateSchema.partial().extend({
  published: z.union([z.literal(0), z.literal(1)]).optional(),
});

export const adminLivePatchSchema = z.object({
  title: z.string().trim().min(1).optional(),
  description: z.string().optional(),
  youtube_id: z.string().nullable().optional(),
  stream_url: z.string().nullable().optional(),
  replay_url: z.string().nullable().optional(),
  chat_moderation: z.union([z.literal(0), z.literal(1)]).optional(),
});

export const adminPetitionCreateSchema = z.object({
  title: z.string().trim().min(1),
  description: z.string().trim().min(1),
  content: z.string().optional(),
  goal: z.coerce.number().int().positive().default(100),
});

export const adminPetitionPatchSchema = z.object({
  title: z.string().trim().min(1).optional(),
  slug: z.string().trim().min(1).optional(),
  description: z.string().trim().min(1).optional(),
  content: z.string().nullable().optional(),
  goal: z.coerce.number().int().positive().optional(),
  active: z.union([z.literal(0), z.literal(1)]).optional(),
});

export const adminContactStatusSchema = z.object({
  status: z.enum(["new", "read", "archived"]),
});

export const adminUserActivateSchema = z.object({
  action: z.enum(["activate", "suspend"]),
});

export const adminUserRoleSchema = z.object({
  role: z.enum(["member", "volunteer", "coordinator"]),
});

export const adminMediaPatchSchema = z.object({
  action: z.literal("reset_hero").optional(),
  hero: z.record(z.string(), z.string()).optional(),
  defaults: z.record(z.string(), z.string()).optional(),
}).passthrough();

export const adminMediaLibraryPatchSchema = z.object({
  path: z.string().min(1),
  alt: z.string().optional(),
  tags: z.array(z.string()).optional(),
  category: z.string().optional(),
});

export const adminMediaCollectionsPutSchema = z.object({
  fikin_gallery: z
    .array(
      z.object({
        src: z.string().min(1),
        alt: z.string(),
        sort: z.number().int(),
      })
    )
    .optional(),
  axis_images: z.record(z.string(), z.string()).optional(),
});

export const adminMediaCollectionsPatchSchema = z.object({
  type: z.enum(["fikin", "axis"]).optional(),
  item: z
    .object({
      src: z.string().min(1),
      alt: z.string(),
      sort: z.number().int(),
    })
    .optional(),
  slug: z.string().optional(),
  src: z.string().optional(),
});

export const adminMediaAssignSchema = z.object({
  type: z.enum([
    "news",
    "studies",
    "campaigns",
    "press_releases",
    "testimonials",
    "live_events",
    "partners",
  ]),
  id: z.number().int().positive(),
  field: z.string().min(1),
  path: z.string().min(1),
});

// ── P2.5 : partenaires ───────────────────────────────────────────────────────
// L'UI (PartnersPanel) envoie explicitement `null` pour vider website /
// logo_url / description : nullish obligatoire.

export const adminPartnerCreateSchema = z.object({
  name: z.string().trim().min(1),
  logo_url: z.string().nullish(),
  website: z.string().nullish(),
  description: z.string().nullish(),
  sort_order: z.coerce.number().int().nullish(),
});

export const adminPartnerPatchSchema = z.object({
  // id validé dans la route (Number(...) + 404 "ID requis", parité historique).
  id: z.unknown().optional(),
  name: z.string().optional(),
  logo_url: z.string().nullish(),
  website: z.string().nullish(),
  description: z.string().nullish(),
  sort_order: z.coerce.number().int().nullish(),
});

// ── P2.5 : route action-based POST /api/admin/live ──────────────────────────
// Schéma discriminé sur `action` (modèle adminActionSchema/P2.3) : action
// inconnue → 400 "Action inconnue" (parité avec l'ancien fallthrough).

const liveEventIdSchema = z.coerce.number().int().positive();

export const adminLiveActionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("pending_chat"), eventId: liveEventIdSchema }),
  z.object({ action: z.literal("all_chat"), eventId: liveEventIdSchema }),
  z.object({ action: z.literal("polls"), eventId: liveEventIdSchema }),
  z.object({
    action: z.literal("set_thumbnail"),
    id: liveEventIdSchema,
    thumbnail: z.string().nullish(),
    thumbnail_alt: z.string().nullish(),
  }),
  z.object({
    action: z.literal("create"),
    title: z.string().min(1),
    description: z.string().nullish(),
    youtube_id: z.string().nullish(),
    stream_url: z.string().nullish(),
    // Parité : tout sauf `false` active la modération (`!== false` en route).
    chat_moderation: z.unknown().optional(),
  }),
  z.object({
    action: z.literal("set_status"),
    id: liveEventIdSchema,
    status: z.enum(["scheduled", "live", "ended", "replay"]),
    replay_url: z.string().nullish(),
  }),
  z.object({
    action: z.literal("send_push"),
    topic: z.enum(["lives", "campaigns", "help"]),
    title: z.string(),
    body: z.string(),
    url: z.string().nullish(),
  }),
  z.object({ action: z.literal("stats") }),
]);

export type AdminLiveActionPayload = z.infer<typeof adminLiveActionSchema>;

// ── God-endpoint POST /api/admin (P2.3) ─────────────────────────────────────
// Schéma discriminé sur `action` : toute action inconnue est rejetée en 400
// (fail-closed — l'ancien dispatch if/else ignorait silencieusement).

const ADMIN_CONTENT_TABLES = [
  "news",
  "studies",
  "campaigns",
  "actions",
  "testimonials",
  "press_releases",
] as const;

const adminActionId = z.coerce.number().int().positive();
/** Données de formulaire admin : structure validée en aval par les builders. */
const adminLooseData = z.record(z.string(), z.unknown());

export const adminActionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("create"),
    table: z.enum([...ADMIN_CONTENT_TABLES, "petitions"]),
    data: adminLooseData,
  }),
  z.object({
    action: z.literal("update_content"),
    table: z.enum(ADMIN_CONTENT_TABLES),
    id: adminActionId,
    data: adminLooseData,
  }),
  z.object({
    action: z.literal("update_status"),
    table: z.enum(["memberships", "help_requests"]),
    id: adminActionId,
    data: z.object({ status: z.string().min(1) }),
  }),
  z.object({ action: z.literal("activate_user"), id: adminActionId }),
  z.object({ action: z.literal("suspend_user"), id: adminActionId }),
  z.object({ action: z.literal("approve_family_link"), id: adminActionId }),
  z.object({ action: z.literal("reject_family_link"), id: adminActionId }),
  z.object({
    action: z.literal("contact_update"),
    id: adminActionId,
    data: z.object({ status: z.enum(["new", "read", "archived"]) }),
  }),
  z.object({
    action: z.literal("help_update"),
    id: adminActionId,
    data: z.object({ status: z.string().min(1), note: z.string().optional() }),
  }),
  z.object({ action: z.literal("petition_signatures_mark_read") }),
  z.object({
    action: z.literal("delete"),
    table: z.enum(ADMIN_CONTENT_TABLES),
    id: adminActionId,
  }),
  z.object({ action: z.literal("reject_membership"), id: adminActionId }),
]);

export type AdminActionPayload = z.infer<typeof adminActionSchema>;
export type AdminActionName = AdminActionPayload["action"];
