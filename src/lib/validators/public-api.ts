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

// ── P2.5 : validation structurelle des routes membre / publiques ────────────
// Ces schémas font le tri STRUCTUREL (types / présence). Les règles MÉTIER
// (PASSWORD_TOO_SHORT, MILITARY_LINK_REQUIRED, EMAIL_EXISTS, INVALID_TOKEN,
// CHILD_NOT_FOUND…) restent dans les services, avec leurs messages d'origine.
// En cas de doute un champ est toléré (nullish) plutôt que rejeté.

export const memberRegisterSchema = z.object({
  // Format réellement validé (comme contactSchema et newsletterSchema ci-dessus,
  // qui utilisaient déjà emailSchema). Auparavant `z.string().min(1)` acceptait
  // « jean » : le compte était créé avec une adresse inutilisable, donc sans
  // activation par email NI réinitialisation de mot de passe possible — un
  // compte mort, qu'aucun écran d'administration ne permet de corriger.
  email: emailSchema,
  // Longueur minimale vérifiée par le service (PASSWORD_TOO_SHORT) — pas ici,
  // pour conserver le message d'erreur historique sur mot de passe vide/court.
  password: z.string(),
  // `.trim().min(1)` : un nom fait d'espaces produisait « Bonjour , » dans les
  // emails et une ligne vide dans l'écran d'administration.
  first_name: z.string().trim().min(1),
  last_name: z.string().trim().min(1),
  // Colonnes nullables en base : tolérés absents/null (parité handler actuel).
  phone: z.string().nullish(),
  province: z.string().nullish(),
  membership_type: z.enum(["famille", "soutien", "benevole"]),
  military_link: z.string().nullish(),
  parent_military_name: z.string().nullish(),
  skills: z.string().nullish(),
});

export const memberResetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(1),
});

/**
 * Actions du gestionnaire de liens familiaux. Les emails/link_id restent
 * tolérés absents : le service produit alors ses erreurs métier historiques
 * (CHILD_NOT_FOUND, PARENT_NOT_FOUND, NOT_FOUND) — le zod ne rejette que les
 * actions inconnues et les types incohérents.
 */
export const memberFamilyActionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("parent_invite"),
    child_email: z.string().nullish(),
    relationship: z.string().nullish(),
  }),
  z.object({
    action: z.literal("child_request"),
    parent_email: z.string().nullish(),
    relationship: z.string().nullish(),
  }),
  z.object({
    action: z.literal("respond"),
    link_id: z.coerce.number().nullish(),
    approve: z.unknown().optional(),
  }),
]);

export const donationCreateSchema = z.object({
  // L'UI envoie amount en string ("10") — coercion, minimum 1 (parité avec
  // l'ancien garde `!amount || amount < 1`).
  amount: z.coerce.number().min(1),
  currency: z.string().nullish(),
  provider: z.enum(["orange", "mpesa", "airtel"]),
  phone: z.string().min(1),
  donor_name: z.string().nullish(),
  donor_email: z.string().nullish(),
});

export const pushSubscribeSchema = z.object({
  endpoint: z.string().min(1),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
  // Les topics inconnus sont filtrés (pas rejetés) dans la route — parité.
  topics: z.array(z.unknown()).nullish(),
});

export const pushUnsubscribeSchema = z.object({
  endpoint: z.string().min(1),
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
