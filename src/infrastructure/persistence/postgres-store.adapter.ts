import "server-only";
import type { StorePort } from "@/domain/ports/store.port";
import type { Store } from "@/domain/entities/store";
import {
  loadStoreFromPostgres,
  saveStoreToPostgres,
  setPgStoreCache,
  getPgStoreCache,
} from "@/infrastructure/persistence/db-adapter";
import { loadSeedStore, nextId } from "@/infrastructure/persistence/store-seed";

async function loadStore(): Promise<Store> {
  const cached = getPgStoreCache();
  if (cached) return cached;

  const fromPg = await loadStoreFromPostgres();
  if (fromPg) {
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
    const store = await loadStore();
    return store;
  },

  async write(mutator: (store: Store) => void): Promise<Store> {
    const store = structuredClone(await this.read()) as Store;
    mutator(store);
    await saveStoreToPostgres(store);
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
  const store = await loadStoreFromPostgres();
  if (store) {
    setPgStoreCache(store);
    return true;
  }
  return false;
}
