import { z } from "@/lib/validators";

export const adminNewsCreateSchema = z.object({
  title: z.string().trim().min(1),
  content: z.string().trim().min(1),
  slug: z.string().trim().optional(),
  excerpt: z.string().optional(),
  category: z.string().optional(),
});

export const adminNewsPatchSchema = z.object({
  title: z.string().trim().min(1).optional(),
  content: z.string().trim().min(1).optional(),
  slug: z.string().trim().optional(),
  excerpt: z.string().optional(),
  category: z.string().optional(),
  published: z.union([z.literal(0), z.literal(1)]).optional(),
});

export const adminPetitionCreateSchema = z.object({
  title: z.string().trim().min(1),
  description: z.string().trim().min(1),
  content: z.string().optional(),
  goal: z.coerce.number().int().positive().default(100),
});

export const adminUserActivateSchema = z.object({
  action: z.enum(["activate", "suspend"]),
});
