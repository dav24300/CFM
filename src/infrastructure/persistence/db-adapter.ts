import "server-only";
import type { Store } from "@/domain/entities/store";
import {
  isNormalizedPgEnabled,
  loadStoreFromTables,
  saveStoreToTables,
} from "@/infrastructure/persistence/pg-sync";
import { CURRENT_SEED_VERSION } from "@/infrastructure/persistence/store-seed";
import {
  ensureSchemaOnce,
  isPgMode,
  withClient,
  withTransaction,
} from "@/infrastructure/persistence/sql/sql-client";

let pgStoreCache: Store | null = null;

export function isPostgresEnabled(): boolean {
  return isPgMode();
}

export async function loadStoreFromPostgres(): Promise<Store | null> {
  if (!isPostgresEnabled()) return null;
  await ensureSchemaOnce();
  return withClient(async (client) => {
    if (isNormalizedPgEnabled()) {
      const fromTables = await loadStoreFromTables(client);
      if (fromTables) {
        pgStoreCache = fromTables;
        return fromTables;
      }
    }

    const res = await client.query<{ data: Store }>(
      "SELECT data FROM app_state WHERE id = 1"
    );
    if (res.rows.length === 0) return null;
    pgStoreCache = res.rows[0].data;
    return res.rows[0].data;
  });
}

export async function saveStoreToPostgres(store: Store): Promise<void> {
  if (!isPostgresEnabled()) return;
  await ensureSchemaOnce();
  await withClient(async (client) => {
    try {
      await client.query("BEGIN");
      await client.query(
        "INSERT INTO app_state (id, data) VALUES (1, $1::jsonb) ON CONFLICT (id) DO NOTHING",
        [JSON.stringify(store)]
      );
      await client.query("SELECT id FROM app_state WHERE id = 1 FOR UPDATE");

      await client.query(
        `INSERT INTO app_state (id, data, updated_at)
         VALUES (1, $1::jsonb, NOW())
         ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()`,
        [JSON.stringify(store)]
      );

      if (isNormalizedPgEnabled()) {
        await saveStoreToTables(client, store);
      }

      await client.query("COMMIT");
      pgStoreCache = store;
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    }
  });
}

/**
 * Réclame l'application des seeds one-shot (ZC-5) : sous verrou advisory,
 * relit store_meta.seed_version et le stampe à CURRENT_SEED_VERSION si (et
 * seulement si) il était inférieur. Retourne true si l'appelant doit seeder.
 * Le verrou élimine la course multi-instances au cold start.
 */
export async function claimSeedVersion(): Promise<boolean> {
  if (!isPostgresEnabled()) return false;
  await ensureSchemaOnce();
  return withTransaction(async (client) => {
    await client.query("SELECT pg_advisory_xact_lock(hashtext('cfm_seed'))");
    const res = await client.query<{ seed_version: number | null }>(
      "SELECT seed_version FROM store_meta WHERE id = 1"
    );
    const current = res.rows[0]?.seed_version ?? 0;
    if (current >= CURRENT_SEED_VERSION) return false;
    await client.query(
      `INSERT INTO store_meta (id, seed_version) VALUES (1, $1)
       ON CONFLICT (id) DO UPDATE SET seed_version = $1, updated_at = NOW()`,
      [CURRENT_SEED_VERSION]
    );
    return true;
  });
}

export function getPgStoreCache(): Store | null {
  return pgStoreCache;
}

export function setPgStoreCache(store: Store): void {
  pgStoreCache = store;
}
