import "server-only";
import type { Pool, PoolClient, QueryResult, QueryResultRow } from "pg";
import { applyFullSchema } from "@/infrastructure/persistence/pg-sync";
import { isServerlessRuntime } from "@/lib/runtime";

/**
 * Client SQL partagé — propriétaire unique du pool pg.
 * db-adapter (moteur Store legacy, en cours de démantèlement) et les modules
 * repositories/sql/* consomment ce pool.
 */

let pool: Pool | null = null;
let schemaApplied = false;
let schemaInFlight: Promise<void> | null = null;

export function isPgMode(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

function readEnvInt(name: string, fallback: number): number {
  const parsed = Number.parseInt(process.env[name] ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export async function getPool(): Promise<Pool> {
  if (pool) return pool;
  const pg = await import("pg");
  const serverless = isServerlessRuntime();

  pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    // En serverless, la concurrence vient du NOMBRE d'instances : un pool large
    // par instance épuise max_connections côté Postgres. Sur un serveur long
    // (Docker/VPS), c'est l'inverse — une seule instance encaisse tout.
    max: readEnvInt("PGPOOL_MAX", serverless ? 5 : 20),
    // Sans ce timeout, pool.connect() attend indéfiniment : sous saturation la
    // file grossit en mémoire au lieu d'échouer vite (503 exploitable).
    connectionTimeoutMillis: readEnvInt("PGPOOL_CONNECT_TIMEOUT_MS", 10_000),
    idleTimeoutMillis: readEnvInt("PGPOOL_IDLE_TIMEOUT_MS", 30_000),
    // Garde-fou serveur : une requête folle ne monopolise pas un slot du pool.
    statement_timeout: readEnvInt("PG_STATEMENT_TIMEOUT_MS", 15_000),
    query_timeout: readEnvInt("PG_QUERY_TIMEOUT_MS", 15_000),
    // Laisse l'instance serverless geler proprement quand le pool est au repos.
    allowExitOnIdle: serverless,
  });

  // Sans ce listener, une erreur sur un client au repos (coupure réseau,
  // redémarrage Postgres) remonte en 'uncaughtException' et tue le process.
  pool.on("error", (err) => {
    console.error("[CFM PG] client au repos en erreur:", err.message);
  });

  return pool;
}

/**
 * Applique scripts/schema.sql une fois par process (idempotent côté SQL :
 * CREATE ... IF NOT EXISTS / ADD COLUMN IF NOT EXISTS / DO-block séquences).
 *
 * Single-flight : le drapeau était posé APRÈS l'await, donc toutes les requêtes
 * concurrentes du démarrage franchissaient la garde et lançaient chacune le
 * script — dont des ALTER TABLE (verrou ACCESS EXCLUSIVE) sur 26 tables.
 * Elles partagent désormais la même promesse.
 *
 * CFM_SKIP_RUNTIME_SCHEMA=true : à poser en production quand le schéma est
 * appliqué hors ligne (`npm run bootstrap:pg`) — sort le DDL du chemin de requête.
 */
export async function ensureSchemaOnce(): Promise<void> {
  if (schemaApplied) return;
  if (process.env.CFM_SKIP_RUNTIME_SCHEMA === "true") {
    schemaApplied = true;
    return;
  }
  if (!schemaInFlight) {
    schemaInFlight = withClient(async (client) => {
      await applyFullSchema(client);
    })
      .then(() => {
        schemaApplied = true;
      })
      .finally(() => {
        schemaInFlight = null;
      });
  }
  await schemaInFlight;
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
