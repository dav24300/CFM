#!/usr/bin/env node
/**
 * Validation stricte 100 % — orchestre les 6 ecarts restants
 * Usage: node scripts/validate-strict-100.mjs [preprodUrl]
 */
import { execSync, spawnSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const PREPROD =
  process.argv[2] || process.env.CFM_PREPROD_URL || "https://cfm-asbl.vercel.app";

const results = [];

function record(id, name, ok, detail = "") {
  results.push({ id, name, ok, detail });
  console.log(`${ok ? "✅" : "❌"} ${id} ${name}${detail ? ` — ${detail}` : ""}`);
}

function run(cmd, label) {
  try {
    execSync(cmd, { cwd: root, stdio: "pipe", shell: true });
    record(label, cmd.split(" ")[0], true);
    return true;
  } catch (e) {
    record(label, cmd, false, e.message?.slice(0, 80));
    return false;
  }
}

async function fetchJson(url) {
  const res = await fetch(url, { cache: "no-store" });
  return { status: res.status, json: await res.json().catch(() => null) };
}

async function smoke(base) {
  try {
    const out = execSync(`node scripts/smoke-routes.mjs "${base}"`, {
      cwd: root,
      encoding: "utf8",
    });
    return out.includes("All smoke tests passed");
  } catch {
    return false;
  }
}

console.log(`\n🎯 Validation stricte 100 % — preprod/prod: ${PREPROD}\n`);

// 1. Preprod miroir (smoke + health)
const health = await fetchJson(`${PREPROD}/api/health`);
record(
  "1",
  "Preprod health",
  health.status === 200 && health.json?.status === "ok",
  JSON.stringify(health.json?.checks || {})
);

const smokeOk = await smoke(PREPROD);
record("1b", "Preprod smoke routes", smokeOk);

// 2. Redis Upstash
const redisOk = health.json?.checks?.redis === "ok";
record(
  "2",
  "Redis Upstash",
  redisOk,
  redisOk ? "ok" : "skipped — configurer UPSTASH_* sur Vercel"
);

// 3. PayDunya
run("npm test -- __tests__/infrastructure/paydunya-webhook.test.ts", "3");
try {
  execSync(`node scripts/test-paydunya-webhook-live.mjs "${PREPROD}"`, {
    cwd: root,
    stdio: "inherit",
    shell: true,
  });
  record("3b", "PayDunya webhook live", true);
} catch {
  record("3b", "PayDunya webhook live (prod keys)", false, "401 si cles configurees");
}

// 4. Backup PostgreSQL (prod URL via CFM_BACKUP_DATABASE_URL)
const backupUrl = process.env.CFM_BACKUP_DATABASE_URL?.trim();
if (!backupUrl) {
  record(
    "4",
    "Backup PostgreSQL",
    false,
    "CFM_BACKUP_DATABASE_URL requis pour gate strict"
  );
} else {
  try {
    execSync("node scripts/backup-restore-pg-test.mjs", {
      cwd: root,
      stdio: "inherit",
      shell: true,
      env: { ...process.env, DATABASE_URL: backupUrl },
    });
    record("4", "Backup PostgreSQL", true);
  } catch {
    record("4", "Backup PostgreSQL", false, "export echoue — verifier connexion Supabase");
  }
}

// 5. Production readiness (health + pages critiques)
const critical = ["/", "/contact", "/api/health", "/admin"];
let prodOk = true;
for (const p of critical) {
  const r = await fetch(`${PREPROD}${p}`, { redirect: "manual" });
  if (r.status >= 500) prodOk = false;
}
record("5", "Production pages critiques", prodOk, PREPROD);

// 6. CSP (verification header)
const home = await fetch(PREPROD);
const csp = home.headers.get("content-security-policy") || "";
const noEval = !csp.includes("unsafe-eval");
record(
  "6",
  "CSP sans unsafe-eval",
  noEval,
  noEval ? "durci" : "unsafe-eval present (deploy requis)"
);

const ok = results.filter((r) => r.ok).length;
const total = results.length;
console.log(`\n--- Strict 100 %: ${ok}/${total} ---\n`);

const blockers = results.filter((r) => !r.ok);
if (blockers.length) {
  console.log("Ecarts restants:");
  for (const b of blockers) console.log(`  • ${b.id} ${b.name}: ${b.detail}`);
}

process.exit(blockers.length === 0 ? 0 : 1);
