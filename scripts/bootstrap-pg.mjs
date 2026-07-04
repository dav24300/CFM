#!/usr/bin/env node
/**
 * Bootstrap PostgreSQL au démarrage VPS (schéma + migration + hydrate store.json)
 * Usage: DATABASE_URL=... node scripts/bootstrap-pg.mjs
 */
import fs from "fs";
import path from "path";
import pg from "pg";
import { execSync } from "child_process";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("DATABASE_URL requis");
  process.exit(1);
}

const schemaSql = fs.readFileSync(path.join(process.cwd(), "scripts", "schema.sql"), "utf-8");
const pool = new pg.Pool({ connectionString: databaseUrl });

async function hasNormalizedData(client) {
  const res = await client.query("SELECT 1 FROM store_meta WHERE id = 1 LIMIT 1");
  return (res.rowCount ?? 0) > 0;
}

async function main() {
  const client = await pool.connect();
  let normalized = false;
  try {
    console.log("→ Application du schéma PostgreSQL…");
    await client.query(schemaSql);
    normalized = await hasNormalizedData(client);
    if (normalized) {
      console.log("✓ Données normalisées déjà présentes");
    }
  } finally {
    client.release();
    await pool.end();
  }

  if (!normalized) {
    console.log("→ Migration store.json → PostgreSQL…");
    execSync("npx tsx scripts/migrate-json-to-pg.mjs", {
      stdio: "inherit",
      env: process.env,
      shell: true,
    });
  }

  console.log("→ Hydratation store.json depuis PostgreSQL…");
  execSync("npx tsx scripts/hydrate-from-postgres.mjs", {
    stdio: "inherit",
    env: process.env,
    shell: true,
  });

  console.log("✓ Bootstrap PostgreSQL terminé");
}

main().catch((err) => {
  console.error("✗ Bootstrap échoué:", err);
  process.exit(1);
});
