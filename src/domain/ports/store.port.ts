import type { Store } from "@/domain/entities/store";

export interface StorePort {
  read(): Promise<Store>;
  write(mutator: (store: Store) => void): Promise<Store>;
  nextId(store: Store): number;
}
