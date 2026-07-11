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
import {
  getJsonStore,
  updateJsonStore,
} from "@/infrastructure/persistence/json-store.impl";

let pgUnavailable = false;

function logPgFallback(reason: unknown): void {
  const detail = reason instanceof Error ? reason.message : String(reason);
  console.warn(
    `[cfm-store] PostgreSQL unavailable (${detail}). Using local JSON store for this process.`
  );
}

async function loadLocalFallback(): Promise<Store> {
  try {
    const json = await getJsonStore();
    setPgStoreCache(json);
    return json;
  } catch {
    const seed = loadSeedStore();
    setPgStoreCache(seed);
    return seed;
  }
}

async function loadStore(): Promise<Store> {
  const cached = getPgStoreCache();
  if (cached) return cached;

  if (pgUnavailable || !process.env.DATABASE_URL) {
    return loadLocalFallback();
  }

  try {
    const fromPg = await loadStoreFromPostgres();
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
  } catch (err) {
    pgUnavailable = true;
    logPgFallback(err);
    return loadLocalFallback();
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
    if (pgUnavailable) {
      const store = await updateJsonStore(mutator);
      setPgStoreCache(store);
      return store;
    }

    try {
      const store = structuredClone(await this.read()) as Store;
      mutator(store);
      await saveStoreToPostgres(store);
      setPgStoreCache(store);
      return store;
    } catch (err) {
      pgUnavailable = true;
      logPgFallback(err);
      const store = await updateJsonStore(mutator);
      setPgStoreCache(store);
      return store;
    }
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

/** @internal Tests only */
export function resetPgFallbackForTests(): void {
  pgUnavailable = false;
}
