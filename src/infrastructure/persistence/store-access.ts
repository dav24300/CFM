import type { Store } from "@/domain/entities/store";
import { getStorePort } from "@/infrastructure/persistence/store.factory";

export function getStore(): Store {
  return getStorePort().read();
}

export function updateStore(mutator: (store: Store) => void): Store {
  return getStorePort().write(mutator);
}

export function nextId(store: Store): number {
  return getStorePort().nextId(store);
}
