import type { StorePort } from "@/domain/ports/store.port";
import type { Store } from "@/domain/entities/store";
import { domainError } from "@/domain/errors/domain-error";
import { jsonStoreAdapter } from "@/infrastructure/persistence/json-store.adapter";

let port: StorePort | null = null;

/**
 * Garde-fou : en mode PG, tous les agrégats sont servis par les modules
 * repositories/sql/* — plus AUCUN chemin runtime ne doit lire/écrire le Store.
 * Toute violation (code oublié, régression) échoue bruyamment ici plutôt que
 * de servir des données périmées.
 */
const pgGuardAdapter: StorePort = {
  async read(): Promise<Store> {
    throw domainError(
      "PERSISTENCE_ERROR",
      "Store legacy inaccessible en mode PG — utiliser les repositories SQL"
    );
  },
  async write(): Promise<Store> {
    throw domainError(
      "PERSISTENCE_ERROR",
      "Store legacy inaccessible en mode PG — utiliser les repositories SQL"
    );
  },
  nextId(): number {
    throw domainError(
      "PERSISTENCE_ERROR",
      "nextId inaccessible en mode PG — les ids viennent des séquences"
    );
  },
};

/** JSON local (data/store.json) en dev sans DATABASE_URL ; garde-fou sinon. */
export function getStorePort(): StorePort {
  if (!port) {
    port = process.env.DATABASE_URL ? pgGuardAdapter : jsonStoreAdapter;
  }
  return port;
}

export function isPgPersistenceMode(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

export function resetStorePortForTests(): void {
  port = null;
}
