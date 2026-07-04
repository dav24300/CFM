import type { StorePort } from "@/domain/ports/store.port";
import type { Store } from "@/domain/entities/store";
import {
  getJsonStore,
  updateJsonStore,
} from "@/infrastructure/persistence/json-store.impl";
import { nextId } from "@/infrastructure/persistence/store-seed";

export const jsonStoreAdapter: StorePort = {
  async read(): Promise<Store> {
    return getJsonStore();
  },
  async write(mutator: (store: Store) => void): Promise<Store> {
    return updateJsonStore(mutator);
  },
  nextId(store: Store): number {
    return nextId(store);
  },
};
