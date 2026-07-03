#!/usr/bin/env node
/**
 * Import data/store.json → PostgreSQL (table app_state JSONB)
 * Usage: DATABASE_URL=... node scripts/import-to-postgres.mjs
 */
import fs from "fs";
import path from "path";
import pg from "pg";

const { Pool } = pg;
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("DATABASE_URL requis");
  process.exit(1);
}

const storePath = path.join(process.cwd(), "data", "store.json");
if (!fs.existsSync(storePath)) {
  console.error("data/store.json introuvable");
  process.exit(1);
}

const data = fs.readFileSync(storePath, "utf-8");
const pool = new Pool({ connectionString: databaseUrl });

try {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS app_state (
      id INTEGER PRIMARY KEY DEFAULT 1,
      data JSONB NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
  await pool.query(
    `INSERT INTO app_state (id, data, updated_at)
     VALUES (1, $1::jsonb, NOW())
     ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()`,
    [data]
  );
  console.log("✓ store.json importé dans PostgreSQL (app_state)");
} finally {
  await pool.end();
}
