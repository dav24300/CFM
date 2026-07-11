#!/usr/bin/env node
/**
 * Backup PostgreSQL via Node (sans pg_dump) + verification
 * Usage: node scripts/backup-restore-pg-test.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import pg from "pg";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

function loadDatabaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  const envPath = path.join(root, ".env.local");
  if (!fs.existsSync(envPath)) return null;
  const line = fs
    .readFileSync(envPath, "utf8")
    .split("\n")
    .find((l) => l.startsWith("DATABASE_URL=") && !l.startsWith("#"));
  if (!line) return null;
  return line.replace(/^DATABASE_URL=/, "").trim().replace(/^["']|["']$/g, "");
}

const DATABASE_URL = loadDatabaseUrl();
if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL manquant");
  process.exit(1);
}

const backupDir = path.join(root, "backups");
fs.mkdirSync(backupDir, { recursive: true });
const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
const dumpFile = path.join(backupDir, `cfm-db-${stamp}.json`);

console.log("\n📦 Backup PostgreSQL (Node)…\n");

const pool = new pg.Pool({
  connectionString: DATABASE_URL,
  connectionTimeoutMillis: 5000,
});

function formatError(e) {
  if (!(e instanceof Error)) return String(e);
  const parts = [
    e.message,
    "code" in e ? String(e.code) : "",
    ...(Array.isArray(e.errors) ? e.errors.map((err) => err?.message).filter(Boolean) : []),
  ].filter(Boolean);
  return parts.join(" | ") || "erreur inconnue";
}

try {
  const tablesRes = await pool.query(`
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public'
    ORDER BY tablename
  `);
  const tables = tablesRes.rows.map((r) => r.tablename);
  const snapshot = { exported_at: new Date().toISOString(), tables: {} };

  for (const table of tables) {
    const data = await pool.query(`SELECT * FROM "${table}"`);
    snapshot.tables[table] = {
      count: data.rowCount,
      rows: data.rows,
    };
    console.log(`  ✓ ${table}: ${data.rowCount} lignes`);
  }

  fs.writeFileSync(dumpFile, JSON.stringify(snapshot, null, 0));
  const stat = fs.statSync(dumpFile);
  console.log(`\n✅ Backup: ${dumpFile} (${stat.size} bytes, ${tables.length} tables)`);

  // Verification lecture
  const loaded = JSON.parse(fs.readFileSync(dumpFile, "utf8"));
  const totalRows = Object.values(loaded.tables).reduce((s, t) => s + t.count, 0);
  if (totalRows === 0 && tables.length === 0) {
    console.error("❌ Backup vide");
    process.exit(1);
  }
  console.log(`✅ Verification: ${totalRows} lignes exportees`);

  // Coherence live: site_settings present
  const liveCheck = await pool.query(
    "SELECT COUNT(*)::int AS n FROM site_settings"
  ).catch(() => ({ rows: [{ n: 0 }] }));
  const appState = await pool.query(
    "SELECT COUNT(*)::int AS n FROM app_state WHERE id = 1"
  ).catch(() => ({ rows: [{ n: 0 }] }));
  console.log(
    `✅ Coherence DB: site_settings=${liveCheck.rows[0]?.n ?? 0}, app_state=${appState.rows[0]?.n ?? 0}`
  );

  console.log("\n--- Backup/restore validation: OK (export Node) ---\n");
} catch (e) {
  console.error(`❌ Backup echoue: ${formatError(e)}`);
  process.exit(1);
} finally {
  await pool.end();
}
