#!/usr/bin/env node
/**
 * Migration store.json → PostgreSQL (tables normalisées + app_state)
 * Usage: DATABASE_URL=... node scripts/migrate-json-to-pg.mjs
 */
import { createRequire } from "module";
import fs from "fs";
import path from "path";
import pg from "pg";

const require = createRequire(import.meta.url);
const Module = require("module");
const resolveFilename = Module._resolveFilename;
Module._resolveFilename = function (request, parent, isMain, options) {
  if (request === "server-only") {
    return require.resolve("./empty.cjs");
  }
  return resolveFilename.call(this, request, parent, isMain, options);
};

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("DATABASE_URL requis");
  process.exit(1);
}

const storePath = path.join(process.cwd(), "data", "store.json");
const seedPath = path.join(process.cwd(), "data", "store.seed.json");
const sourcePath = fs.existsSync(storePath) ? storePath : seedPath;

if (!fs.existsSync(sourcePath)) {
  console.error("Aucun store.json ni store.seed.json trouvé");
  process.exit(1);
}

const store = JSON.parse(fs.readFileSync(sourcePath, "utf-8"));
const schemaSql = fs.readFileSync(path.join(process.cwd(), "scripts", "schema.sql"), "utf-8");
const pool = new pg.Pool({ connectionString: databaseUrl });

async function main() {
  const client = await pool.connect();
  try {
    console.log(`→ Source : ${path.basename(sourcePath)}`);
    await client.query(schemaSql);
    await client.query("BEGIN");

    const { saveStoreToTables } = await import(
      "../src/infrastructure/persistence/pg-sync.ts"
    );

    await client.query(
      `INSERT INTO app_state (id, data, updated_at)
       VALUES (1, $1::jsonb, NOW())
       ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()`,
      [JSON.stringify(store)]
    );

    await saveStoreToTables(client, store);
    await client.query("COMMIT");

    console.log("✓ Migration terminée : app_state + tables normalisées");
    console.log(`  - news: ${store.news?.length ?? 0}`);
    console.log(`  - users: ${store.users?.length ?? 0}`);
    console.log(`  - petitions: ${store.petitions?.length ?? 0}`);
    console.log(`  - live_events: ${store.live_events?.length ?? 0}`);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("✗ Migration échouée:", err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
