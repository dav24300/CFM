import fs from "fs";
import path from "path";
import type { Store } from "@/domain/entities/store";
import { assertProductionConfig } from "@/lib/config";
import {
  applySeedsOnce,
  defaultStore,
  nextId,
} from "@/infrastructure/persistence/store-seed";

const dataDir = path.join(process.cwd(), "data");
const storePath = path.join(dataDir, "store.json");

let fileStoreCache: Store | null = null;
let productionConfigChecked = false;

function ensureStore(): Store {
  if (!productionConfigChecked) {
    productionConfigChecked = true;
    assertProductionConfig();
  }

  if (fileStoreCache) {
    return fileStoreCache;
  }

  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  if (!fs.existsSync(storePath)) {
    const store = defaultStore();
    fs.writeFileSync(storePath, JSON.stringify(store, null, 2), "utf-8");
    fileStoreCache = store;
    return store;
  }
  const raw = fs.readFileSync(storePath, "utf-8");
  const store = JSON.parse(raw) as Store;
  // Normalisation systématique + seeds de démo une seule fois (_seed_version) :
  // un admin qui vide une collection ne la voit plus re-seedée (ZC-5).
  const changed = applySeedsOnce(store);
  if (changed) {
    saveStore(store);
  } else {
    fileStoreCache = store;
  }
  return store;
}

function saveStore(store: Store): void {
  fileStoreCache = store;
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  fs.writeFileSync(storePath, JSON.stringify(store, null, 2), "utf-8");
}

export function getJsonStore(): Store {
  return ensureStore();
}

export function updateJsonStore(mutator: (store: Store) => void): Store {
  const store = ensureStore();
  mutator(store);
  saveStore(store);
  return store;
}

export { nextId };
