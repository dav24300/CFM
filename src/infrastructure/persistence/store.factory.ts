import type { StorePort } from "@/domain/ports/store.port";
import { jsonStoreAdapter } from "@/infrastructure/persistence/json-store.adapter";
import { postgresStoreAdapter } from "@/infrastructure/persistence/postgres-store.adapter";

export { isNormalizedPgEnabled } from "@/infrastructure/persistence/pg-sync";

let port: StorePort | null = null;

/** PostgreSQL quand DATABASE_URL est défini ; sinon JSON local (data/store.json). */
export function getStorePort(): StorePort {
  if (!port) {
    port = process.env.DATABASE_URL ? postgresStoreAdapter : jsonStoreAdapter;
  }
  return port;
}

export function isPgPersistenceMode(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

export function resetStorePortForTests(): void {
  port = null;
}
