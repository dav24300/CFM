import { z } from "zod";
import { jsonError } from "@/infrastructure/http/api-response";
import { normalizePhoneRdc } from "@/domain/phone";

export { z };

export function parseOrBadRequest<T>(
  schema: z.ZodType<T>,
  payload: unknown,
  message = "Champs invalides"
): { ok: true; data: T } | { ok: false; response: ReturnType<typeof jsonError> } {
  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    return { ok: false, response: jsonError(message, 400) };
  }
  return { ok: true, data: parsed.data };
}

export const emailSchema = z.string().trim().email();

/**
 * Email FACULTATIF : le formulaire envoie "" (jamais undefined) pour un champ
 * vide, or `emailSchema.optional()` seul rejetterait "". Le preprocess ramène
 * la chaîne vide à undefined avant validation — sans quoi une inscription sans
 * email renvoie un 400 « email invalide » incompréhensible pour l'opérateur.
 */
export const optionalEmailSchema = z.preprocess(
  (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
  emailSchema.optional()
);

/**
 * Téléphone RDC : validé (normalisable) au niveau structurel. La normalisation
 * effective (vers phone_e164) se fait dans le service, AVANT l'aiguillage de
 * mode, pour que PG et JSON reçoivent rigoureusement la même valeur.
 */
export const rdcPhoneSchema = z
  .string()
  .trim()
  .refine((v) => normalizePhoneRdc(v) !== null, { message: "PHONE_INVALID" });
