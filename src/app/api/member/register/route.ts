import { NextRequest } from "next/server";
import { registerMember } from "@/application/services/member.service";
import { handleDomainErrorOrFallback, jsonSuccess } from "@/infrastructure/http/api-response";
import { DomainError } from "@/domain/errors/domain-error";
import { parseOrBadRequest } from "@/lib/validators";
import { memberRegisterSchema } from "@/lib/validators/public-api";

// Un conflit d'EXISTENCE (email ou numéro déjà pris) ne doit pas être révélé sur
// cet endpoint public : la population (familles de militaires en RDC) rend
// l'appartenance sensible, et le plafond middleware (500/10 min/IP) laisse les
// ~300 membres énumérables en quelques minutes. On répond alors EXACTEMENT comme
// pour un succès — le vrai conflit n'est visible qu'au back-office. Les erreurs
// portant sur les DONNÉES SOUMISES (numéro invalide, mot de passe trop court,
// lien militaire manquant) restent affichées : elles n'énumèrent rien et l'usager
// doit les corriger.
const ENUMERATION_CODES = new Set(["EMAIL_EXISTS", "PHONE_EXISTS"]);

export async function POST(request: NextRequest) {
  const parsed = parseOrBadRequest(
    memberRegisterSchema,
    await request.json().catch(() => null),
    "Champs obligatoires manquants"
  );
  if (!parsed.ok) return parsed.response;

  try {
    const result = await registerMember(
      parsed.data as Parameters<typeof registerMember>[0]
    );
    return jsonSuccess(result);
  } catch (err) {
    if (err instanceof DomainError && ENUMERATION_CODES.has(err.code)) {
      // Réponse indiscernable d'une inscription réelle (l'UI affiche un message
      // générique bâti sur les champs saisis, pas sur cette réponse).
      return jsonSuccess({ status: "pending" });
    }
    return handleDomainErrorOrFallback(err, "Erreur");
  }
}
