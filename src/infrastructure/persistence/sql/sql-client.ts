import "server-only";
import type { Pool, PoolClient, QueryResult, QueryResultRow } from "pg";
import { applyFullSchema } from "@/infrastructure/persistence/pg-sync";

/**
 * Client SQL partagé — propriétaire unique du pool pg.
 * db-adapter (moteur Store legacy, en cours de démantèlement) et les modules
 * repositories/sql/* consomment ce pool.
 */

let pool: Pool | null = null;
let schemaApplied = false;

export function isPgMode(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

export async function getPool(): Promise<Pool> {
  if (pool) return pool;
  const pg = await import("pg");
  pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  return pool;
}

/**
 * Applique scripts/schema.sql une fois par process (idempotent côté SQL :
 * CREATE ... IF NOT EXISTS / ADD COLUMN IF NOT EXISTS / DO-block séquences).
 */
export async function ensureSchemaOnce(): Promise<void> {
  if (schemaApplied) return;
  await withClient(async (client) => {
    await applyFullSchema(client);
  });
  schemaApplied = true;
}

export async function withClient<T>(
  fn: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await (await getPool()).connect();
  try {
    return await fn(client);
  } finally {
    client.release();
  }
}

export async function withTransaction<T>(
  fn: (client: PoolClient) => Promise<T>
): Promise<T> {
  return withClient(async (client) => {
    await client.query("BEGIN");
    try {
      const result = await fn(client);
      await client.query("COMMIT");
      return result;
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    }
  });
}

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<QueryResult<T>> {
  await ensureSchemaOnce();
  return (await getPool()).query<T>(text, params);
}

/** @internal Tests uniquement */
export async function closePoolForTests(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
  schemaApplied = false;
}
