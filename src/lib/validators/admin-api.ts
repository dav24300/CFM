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
