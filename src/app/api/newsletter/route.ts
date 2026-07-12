import { NextRequest } from "next/server";
import { subscribeNewsletter } from "@/application/services/contact.service";
import { handleDomainError, jsonSuccess } from "@/infrastructure/http/api-response";
import { parseOrBadRequest } from "@/lib/validators";
import { newsletterSchema } from "@/lib/validators/public-api";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = parseOrBadRequest(newsletterSchema, body, "Champs obligatoires manquants");
    if (!parsed.ok) return parsed.response;

    await subscribeNewsletter(parsed.data.email);
    return jsonSuccess();
  } catch (err) {
    return handleDomainError(err);
  }
}
