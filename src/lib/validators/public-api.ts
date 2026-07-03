import { z, emailSchema } from "@/lib/validators";

export const contactSchema = z.object({
  name: z.string().trim().min(1),
  email: emailSchema,
  message: z.string().trim().min(1),
  subject: z.string().optional(),
  type: z.string().optional(),
});

export const newsletterSchema = z.object({
  email: emailSchema,
});

export const petitionSignSchema = z.object({
  name: z.string().trim().optional(),
  email: z.string().trim().email().optional(),
});

export const membershipSchema = z
  .object({
    type: z.string().trim().min(1),
    first_name: z.string().trim().min(1),
    last_name: z.string().trim().min(1),
    phone: z.string().trim().min(1),
    email: z.string().optional(),
    province: z.string().optional(),
    military_link: z.string().optional(),
    parent_military_name: z.string().optional(),
    skills: z.string().optional(),
    message: z.string().optional(),
  })
  .superRefine((v, ctx) => {
    if (v.type === "famille" && !v.military_link) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["military_link"],
        message: "MILITARY_LINK_REQUIRED",
      });
    }
  });
