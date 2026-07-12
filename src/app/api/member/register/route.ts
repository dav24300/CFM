import { NextRequest } from "next/server";
import { registerMember } from "@/application/services/member.service";
import { handleDomainErrorOrFallback, jsonSuccess } from "@/lib/api-response";
import { parseOrBadRequest } from "@/lib/validators";
import { memberRegisterSchema } from "@/lib/validators/public-api";

export async function POST(request: NextRequest) {
  const parsed = parseOrBadRequest(
    memberRegisterSchema,
    await request.json().catch(() => null),
    "Champs obligatoires manquants"
  );
  if (!parsed.ok) return parsed.response;

  try {
    // Le schéma tolère null/absent sur les colonnes nullables (phone, province…)
    // là où le type de registerUser est plus strict que son runtime — parité
    // avec l'ancien handler qui passait le body brut.
    const result = await registerMember(
      parsed.data as Parameters<typeof registerMember>[0]
    );
    return jsonSuccess(result);
  } catch (err) {
    return handleDomainErrorOrFallback(err, "Erreur");
  }
}
