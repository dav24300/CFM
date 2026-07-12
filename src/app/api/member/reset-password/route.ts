import { NextRequest } from "next/server";
import { resetPassword } from "@/application/services/member.service";
import { handleDomainErrorOrFallback, jsonSuccess } from "@/infrastructure/http/api-response";
import { parseOrBadRequest } from "@/lib/validators";
import { memberResetPasswordSchema } from "@/lib/validators/public-api";

export async function POST(request: NextRequest) {
  const parsed = parseOrBadRequest(
    memberResetPasswordSchema,
    await request.json().catch(() => null),
    "Champs requis"
  );
  if (!parsed.ok) return parsed.response;

  try {
    await resetPassword(parsed.data.token, parsed.data.password);
    return jsonSuccess();
  } catch (err) {
    return handleDomainErrorOrFallback(err, "Erreur");
  }
}
