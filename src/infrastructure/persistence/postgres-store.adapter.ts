import "server-only";
import type { StorePort } from "@/domain/ports/store.port";
import type { Store } from "@/domain/entities/store";
import {
  claimSeedVersion,
  loadStoreFromPostgres,
  saveStoreToPostgres,
  setPgStoreCache,
  getPgStoreCache,
} from "@/infrastructure/persistence/db-adapter";
import {
  CURRENT_SEED_VERSION,
  loadSeedStore,
  nextId,
  normalizeCollections,
  seedDemoData,
} from "@/infrastructure/persistence/store-seed";
import { mapPgError } from "@/infrastructure/persistence/sql/pg-errors";
import { seedMigratedAggregates } from "@/infrastructure/persistence/sql/seed-hooks";

/**
 * Adaptateur Store sur PostgreSQL.
 * Plus AUCUN fallback JSON silencieux (ZC-4) : une erreur PostgreSQL remonte
 * en erreur domaine (PERSISTENCE_UNAVAILABLE → 503 via handleDomainError),
 * jamais vers data/store.json (éphémère et par instance en serverless).
 * Le mode JSON reste réservé au dev sans DATABASE_URL (json-store.adapter).
 */

async function loadStore(): Promise<Store> {
  const cached = getPgStoreCache();
  if (cached) return cached;

  let fromPg: Store | null = null;
  try {
    fromPg = await loadStoreFromPostgres();
  } catch (err) {
    mapPgError(err);
  }

  if (fromPg) {
    // Normalisation des collections manquantes : toujours, sans injection de données.
    normalizeCollections(fromPg);
    // Seeds de démo one-shot (ZC-5) : uniquement si store_meta.seed_version
    // est en retard, sous verrou advisory (course multi-instances éliminée).
    if ((fromPg._seed_version ?? 0) < CURRENT_SEED_VERSION) {
      try {
        if (await claimSeedVersion()) {
          seedDemoData(fromPg);
          fromPg._seed_version = CURRENT_SEED_VERSION;
          await saveStoreToPostgres(fromPg);
          // Les tables migrées (SQL ciblé) ne passent plus par le save Store.
          await seedMigratedAggregates();
        } else {
          // Une autre instance a déjà stampé ; ce snapshot sera rafraîchi au prochain load.
          fromPg._seed_version = CURRENT_SEED_VERSION;
        }
      } catch {
        // Seed non bloquant : le portail reste utilisable même si la persistance échoue.
      }
    }
    setPgStoreCache(fromPg);
    return fromPg;
  }

  const seed = loadSeedStore();
  setPgStoreCache(seed);
  return seed;
}

export const postgresStoreAdapter: StorePort = {
  async read(): Promise<Store> {
    const cached = getPgStoreCache();
    if (cached) return cached;
    return loadStore();
  },

  async write(mutator: (store: Store) => void): Promise<Store> {
    const store = structuredClone(await this.read()) as Store;
    // Les erreurs du mutator (erreurs domaine : ALREADY_SIGNED, NOT_FOUND…)
    // se propagent telles quelles — comportement inchangé.
    mutator(store);
    try {
      await saveStoreToPostgres(store);
    } catch (err) {
      mapPgError(err);
    }
    setPgStoreCache(store);
    return store;
  },

  nextId(store: Store): number {
    return nextId(store);
  },
};

/** Health check / scripts CLI */
export async function bootstrapPostgresStore(): Promise<boolean> {
  if (!process.env.DATABASE_URL) return false;
  try {
    const store = await loadStoreFromPostgres();
    if (store) {
      setPgStoreCache(store);
      return true;
    }
  } catch {
    return false;
  }
  return false;
}
