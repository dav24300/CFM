import type { StorePort } from "@/domain/ports/store.port";
import {
  getStore,
  updateStore,
  nextId,
} from "@/infrastructure/persistence/store.impl";
import type { Store } from "@/domain/entities/store";

export const jsonStoreAdapter: StorePort = {
  read(): Store {
    return getStore();
  },
  write(mutator: (store: Store) => void): Store {
    return updateStore(mutator);
  },
  nextId(store: Store): number {
    return nextId(store);
  },
};
