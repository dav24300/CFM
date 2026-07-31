import { NextRequest } from "next/server";
import { subscribeNewsletter } from "@/application/services/contact.service";
import { handleDomainError, jsonSuccess } from "@/infrastructure/http/api-response";
import { parseOrBadRequest } from "@/lib/validators";
import { newsletterSchema } from "@/lib/validators/public-api";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Honeypot : un champ invisible rempli = bot. On répond « succès » sans rien
    // enregistrer, pour ne pas signaler au robot que le piège a été détecté.
    if (typeof body?.website === "string" && body.website.trim() !== "") {
      return jsonSuccess();
    }

    const parsed = parseOrBadRequest(newsletterSchema, body, "Champs obligatoires manquants");
    if (!parsed.ok) return parsed.response;

    await subscribeNewsletter(parsed.data.email);
    return jsonSuccess();
  } catch (err) {
    return handleDomainError(err);
  }
}
