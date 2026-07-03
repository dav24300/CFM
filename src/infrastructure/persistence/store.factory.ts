import type { StorePort } from "@/domain/ports/store.port";
import { jsonStoreAdapter } from "@/infrastructure/persistence/json-store.adapter";

export { isNormalizedPgEnabled } from "@/infrastructure/persistence/pg-sync";

let port: StorePort | null = null;

/**
 * PostgreSQL est la source de vérité quand DATABASE_URL est défini.
 * L'hydratation synchrone se fait via instrumentation.ts au boot ;
 * les écritures convergent vers PG via store.impl → saveStoreToPostgres.
 */
export function getStorePort(): StorePort {
  if (!port) {
    port = jsonStoreAdapter;
  }
  return port;
}

export const pgStoreAdapter: StorePort = jsonStoreAdapter;

export function isPgPersistenceMode(): boolean {
  return Boolean(process.env.DATABASE_URL);
}
