import type { Store } from "@/domain/entities/store";

export interface StorePort {
  read(): Store;
  write(mutator: (store: Store) => void): Store;
  nextId(store: Store): number;
}
