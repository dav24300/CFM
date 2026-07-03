import "server-only";
import type { Store } from "@/domain/entities/store";
import {
  applyFullSchema,
  isNormalizedPgEnabled,
  loadStoreFromTables,
  saveStoreToTables,
} from "@/infrastructure/persistence/pg-sync";

let pool: import("pg").Pool | null = null;
let pgStoreCache: Store | null = null;

export function isPostgresEnabled(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

async function getPool(): Promise<import("pg").Pool> {
  if (pool) return pool;
  const pg = await import("pg");
  pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  return pool;
}

export async function ensurePgSchema(): Promise<void> {
  const client = await (await getPool()).connect();
  try {
    await applyFullSchema(client);
  } finally {
    client.release();
  }
}

export async function loadStoreFromPostgres(): Promise<Store | null> {
  if (!isPostgresEnabled()) return null;
  await ensurePgSchema();
  const client = await (await getPool()).connect();
  try {
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
  } finally {
    client.release();
  }
}

export async function saveStoreToPostgres(store: Store): Promise<void> {
  if (!isPostgresEnabled()) return;
  await ensurePgSchema();
  const client = await (await getPool()).connect();
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
  } finally {
    client.release();
  }
}

export function getPgStoreCache(): Store | null {
  return pgStoreCache;
}

export function setPgStoreCache(store: Store): void {
  pgStoreCache = store;
}
