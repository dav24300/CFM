import type { Store } from "@/domain/entities/store";
import { getStorePort } from "@/infrastructure/persistence/store.factory";

export async function getStoreAsync(): Promise<Store> {
  return getStorePort().read();
}

export async function updateStoreAsync(
  mutator: (store: Store) => void
): Promise<Store> {
  return getStorePort().write(mutator);
}

export function nextId(store: Store): number {
  return getStorePort().nextId(store);
}

/** @deprecated Utiliser getStoreAsync */
export async function getStore(): Promise<Store> {
  return getStoreAsync();
}

/** @deprecated Utiliser updateStoreAsync */
export async function updateStore(
  mutator: (store: Store) => void
): Promise<Store> {
  return updateStoreAsync(mutator);
}
