import { DomainError, domainError } from "@/domain/errors/domain-error";

/**
 * Conversion des erreurs pg en erreurs domaine.
 * IMPORTANT : handleDomainError (api-response.ts) renvoie err.message en 400
 * pour toute Error générique — aucune erreur pg brute ne doit s'échapper d'un
 * module SQL, sinon le détail SQL fuit dans la réponse HTTP.
 */

/** unique_violation (23505) : nom de contrainte → code domaine existant. */
const UNIQUE_CONSTRAINT_TO_CODE: Record<string, string> = {
  idx_petition_sig_unique: "ALREADY_SIGNED",
  idx_newsletter_email: "ALREADY_EXISTS",
  users_email_key: "EMAIL_EXISTS",
  live_poll_votes_poll_id_voter_key_key: "ALREADY_VOTED",
};

/** Codes pg de connexion/indisponibilité → PERSISTENCE_UNAVAILABLE (503). */
const CONNECTION_PG_CODES = new Set([
  "08000", "08001", "08003", "08004", "08006", // connection_exception*
  "57P01", "57P02", "57P03",                    // admin_shutdown / crash / cannot_connect_now
  "53300",                                       // too_many_connections
]);

const CONNECTION_SYSCALL_CODES = new Set([
  "ECONNREFUSED", "ECONNRESET", "ETIMEDOUT", "ENOTFOUND", "EHOSTUNREACH", "EAI_AGAIN",
]);

type PgLikeError = {
  code?: string;
  constraint?: string;
  errors?: { code?: string }[];
};

function isConnectionError(err: unknown): boolean {
  const e = err as PgLikeError;
  if (e?.code && (CONNECTION_PG_CODES.has(e.code) || CONNECTION_SYSCALL_CODES.has(e.code))) {
    return true;
  }
  // AggregateError (dns/multi-adresses) — pg lève parfois un agrégat de syscalls
  if (Array.isArray(e?.errors)) {
    return e.errors.some((sub) => sub?.code && CONNECTION_SYSCALL_CODES.has(sub.code));
  }
  return false;
}

function logStructured(event: string, err: unknown): void {
  const detail = err instanceof Error ? err.message : String(err);
  const code = (err as PgLikeError)?.code;
  console.error(
    JSON.stringify({ evt: event, code: code ?? null, detail, at: new Date().toISOString() })
  );
}

/** Convertit et relance : ne retourne jamais. */
export function mapPgError(err: unknown): never {
  if (err instanceof DomainError) throw err;

  const e = err as PgLikeError;
  if (e?.code === "23505" && e.constraint && UNIQUE_CONSTRAINT_TO_CODE[e.constraint]) {
    throw domainError(UNIQUE_CONSTRAINT_TO_CODE[e.constraint]);
  }

  if (isConnectionError(err)) {
    logStructured("pg_unavailable", err);
    throw domainError("PERSISTENCE_UNAVAILABLE", "Service temporairement indisponible");
  }

  logStructured("pg_error", err);
  throw domainError("PERSISTENCE_ERROR", "Erreur serveur");
}
