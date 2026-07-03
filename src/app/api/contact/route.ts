import { NextRequest } from "next/server";
import { submitContact } from "@/application/services/contact.service";
import { handleDomainError, jsonMissingFields, jsonSuccess } from "@/lib/api-response";
import { parseOrBadRequest } from "@/lib/validators";
import { contactSchema } from "@/lib/validators/public-api";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = parseOrBadRequest(contactSchema, body, "Champs obligatoires manquants");
    if (!parsed.ok) return parsed.response;
    const { name, email, message, subject, type } = parsed.data;

    if (!name || !email || !message) {
      return jsonMissingFields();
    }

    submitContact({
      name,
      email,
      subject,
      message,
      type: type || "contact",
    });

    return jsonSuccess();
  } catch (err) {
    return handleDomainError(err);
  }
}
