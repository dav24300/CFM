import { NextRequest } from "next/server";
import { submitMembership } from "@/application/services/contact.service";
import { handleDomainError, jsonSuccess } from "@/lib/api-response";
import { parseOrBadRequest } from "@/lib/validators";
import { membershipSchema } from "@/lib/validators/public-api";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = parseOrBadRequest(membershipSchema, body, "Champs obligatoires manquants");
    if (!parsed.ok) return parsed.response;

    await submitMembership(parsed.data);
    return jsonSuccess();
  } catch (err) {
    return handleDomainError(err);
  }
}
