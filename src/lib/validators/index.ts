import { z } from "zod";
import { jsonError } from "@/infrastructure/http/api-response";

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
