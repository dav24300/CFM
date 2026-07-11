import { NextResponse } from "next/server";
import { DomainError } from "@/domain/errors/domain-error";

type ErrorSpec = { message: string; status: number };

const DOMAIN_ERRORS: Record<string, ErrorSpec> = {
  ALREADY_EXISTS: { message: "Email déjà inscrit", status: 409 },
  ALREADY_SIGNED: { message: "Déjà signé", status: 409 },
  ALREADY_VOTED: { message: "Vous avez déjà voté", status: 400 },
  EMAIL_EXISTS: { message: "Cet email est déjà utilisé", status: 400 },
  LINK_EXISTS: { message: "Un lien existe déjà", status: 400 },
  PASSWORD_TOO_SHORT: { message: "Mot de passe minimum 8 caractères", status: 400 },
  MILITARY_LINK_REQUIRED: { message: "Lien militaire requis pour les familles", status: 400 },
  INVALID_TOKEN: { message: "Lien invalide ou expiré", status: 400 },
  NOT_FOUND: { message: "Non trouvé", status: 404 },
  NOT_LIVE: { message: "Le chat est fermé (événement non en direct)", status: 400 },
  EMPTY_MESSAGE: { message: "Message vide", status: 400 },
  CHILD_NOT_FOUND: { message: "Aucun compte enfant trouvé avec cet email", status: 400 },
  PARENT_NOT_FOUND: { message: "Aucun compte parent trouvé avec cet email", status: 400 },
  FORBIDDEN: { message: "Action non autorisée", status: 400 },
  SELF_LINK: { message: "Impossible de lier votre propre compte", status: 400 },
  NOT_FAMILY_PARENT: { message: "Seuls les membres famille peuvent inviter", status: 400 },
  POLL_CLOSED: { message: "Sondage fermé", status: 400 },
  INVALID_OPTION: { message: "Option invalide", status: 400 },
  EVENT_NOT_FOUND: { message: "Événement introuvable", status: 404 },
  UNAUTHORIZED: { message: "Non autorisé", status: 401 },
  USER_NOT_FOUND: { message: "Utilisateur introuvable", status: 404 },
  PAYDUNYA_KEYS_MISSING: { message: "Configuration paiement manquante", status: 500 },
  MISSING_FIELDS: { message: "Champs obligatoires manquants", status: 400 },
  PARENTAL_CONSENT_REQUIRED: { message: "Consentement parental requis", status: 400 },
  MISSING_SIGNER: { message: "Nom et email obligatoires", status: 400 },
  PAYDUNYA_ERROR: { message: "Erreur PayDunya", status: 502 },
  PERSISTENCE_UNAVAILABLE: {
    message: "Service temporairement indisponible, réessayez dans un instant",
    status: 503,
  },
  PERSISTENCE_ERROR: { message: "Erreur serveur", status: 500 },
};

function resolveDomainCode(err: unknown): string | null {
  if (err instanceof DomainError) return err.code;
  if (err instanceof Error && DOMAIN_ERRORS[err.message]) return err.message;
  return null;
}

export function jsonSuccess<T extends Record<string, unknown> = Record<string, never>>(
  data?: T
): NextResponse {
  return NextResponse.json({ success: true, ...data });
}

export function jsonData<T>(data: T): NextResponse {
  return NextResponse.json(data);
}

export function jsonError(message: string, status: number): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

export function jsonMissingFields(): NextResponse {
  return jsonError("Champs obligatoires manquants", 400);
}

export function jsonUnauthorized(message = "Non autorisé"): NextResponse {
  return jsonError(message, 401);
}

export function jsonForbidden(message = "Accès refusé"): NextResponse {
  return jsonError(message, 403);
}

export function jsonNotFound(message = "Non trouvé"): NextResponse {
  return jsonError(message, 404);
}

export function handleDomainError(
  err: unknown,
  fallbackMessage = "Erreur serveur"
): NextResponse {
  const code = resolveDomainCode(err);
  if (code) {
    const spec = DOMAIN_ERRORS[code];
    if (spec) return jsonError(spec.message, spec.status);
  }
  if (err instanceof Error) {
    if (err.message && err.message !== "Error") {
      return jsonError(err.message, 400);
    }
  }
  return jsonError(fallbackMessage, 500);
}

export function handleDomainErrorOrFallback(
  err: unknown,
  fallbackMessage = "Erreur"
): NextResponse {
  const code = resolveDomainCode(err);
  if (code) {
    const spec = DOMAIN_ERRORS[code];
    if (spec) return jsonError(spec.message, spec.status);
  }
  return jsonError(
    err instanceof Error ? err.message : fallbackMessage,
    400
  );
}
