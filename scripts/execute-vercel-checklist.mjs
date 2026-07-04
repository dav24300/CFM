#!/usr/bin/env node
/**
 * Exécute le checklist VERCEL-ENV-CHECKLIST.md (partie automatisée).
 *
 * Prérequis : DATABASE_URL + SUPABASE_SERVICE_ROLE_KEY en variables d'environnement.
 *
 * Étapes :
 *  1. Variables Vercel (secrets + compléments)
 *  2. Bucket Supabase media-uploads
 *  3. bootstrap:pg
 *  4. Redeploy Vercel production
 *  5. Vérification /api/health
 */
import { execSync, spawnSync } from "child_process";

const databaseUrl = process.env.DATABASE_URL?.trim();
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

if (!databaseUrl || !serviceKey) {
  console.error("DATABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont requis.");
  process.exit(1);
}

console.log("=== Étape 1/5 — Variables Vercel ===\n");
execSync("node scripts/setup-vercel-env.mjs", {
  stdio: "inherit",
  env: process.env,
});

console.log("\n=== Étape 2/5 — Bucket Supabase ===\n");
execSync("node scripts/setup-supabase-bucket.mjs", {
  stdio: "inherit",
  env: process.env,
});

console.log("\n=== Étape 3/5 — Bootstrap PostgreSQL ===\n");
execSync("npm run bootstrap:pg", {
  stdio: "inherit",
  env: { ...process.env, DATABASE_URL: databaseUrl },
});

console.log("\n=== Étape 4/5 — Redeploy Vercel ===\n");
const deploy = spawnSync("npx", ["vercel", "--prod", "--yes"], {
  stdio: "inherit",
  shell: true,
});
if (deploy.status !== 0) process.exit(deploy.status ?? 1);

console.log("\n=== Étape 5/5 — Health check ===\n");
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://cfm-asbl.vercel.app";
const health = await fetch(`${siteUrl}/api/health`, {
  signal: AbortSignal.timeout(30000),
});
const body = await health.json();
console.log(JSON.stringify(body, null, 2));

if (body.checks?.database !== "ok") {
  console.error("\n⚠ database n'est pas « ok » — vérifiez DATABASE_URL (pooler 6543)");
  process.exit(1);
}

console.log("\n✓ Checklist terminé.");
