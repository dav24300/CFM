#!/usr/bin/env node
/**
 * Hydrate data/store.json depuis PostgreSQL (tables normalisées ou app_state)
 * Usage: DATABASE_URL=... node scripts/hydrate-from-postgres.mjs
 */
import fs from "fs";
import path from "path";
import pg from "pg";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("DATABASE_URL requis");
  process.exit(1);
}

const pool = new pg.Pool({ connectionString: databaseUrl });

async function main() {
  const client = await pool.connect();
  try {
    const { loadStoreFromTables } = await import("../src/lib/persistence/pg-sync.ts");
    let store = await loadStoreFromTables(client);

    if (!store) {
      const res = await client.query("SELECT data FROM app_state WHERE id = 1");
      if (res.rows.length === 0) {
        console.log("Aucune donnée PostgreSQL — conservez store.json local");
        process.exit(0);
      }
      store = res.rows[0].data;
    }

    const dataDir = path.join(process.cwd(), "data");
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

    const storePath = path.join(dataDir, "store.json");
    fs.writeFileSync(storePath, JSON.stringify(store, null, 2), "utf-8");
    console.log("✓ store.json hydraté depuis PostgreSQL");
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
