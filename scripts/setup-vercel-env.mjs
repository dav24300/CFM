#!/usr/bin/env node
/**
 * Configure les variables Vercel production (cfm-asbl).
 * Usage:
 *   DATABASE_URL="postgresql://..." SUPABASE_SERVICE_ROLE_KEY="..." node scripts/setup-vercel-env.mjs
 * Les secrets manquants sont générés automatiquement.
 */
import { spawnSync } from "child_process";
import crypto from "crypto";

const required = ["DATABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"];
const missing = required.filter((k) => !process.env[k]?.trim());
if (missing.length) {
  console.error(`Variables requises manquantes : ${missing.join(", ")}`);
  console.error("Exemple :");
  console.error(
    '  DATABASE_URL="postgresql://postgres.[ref]:[pwd]@...pooler.supabase.com:6543/postgres" \\',
  );
  console.error('  SUPABASE_SERVICE_ROLE_KEY="eyJ..." \\');
  console.error("  node scripts/setup-vercel-env.mjs");
  process.exit(1);
}

const sessionSecret =
  process.env.SESSION_SECRET || crypto.randomBytes(32).toString("hex");
const dataEncryptionKey =
  process.env.DATA_ENCRYPTION_KEY || crypto.randomBytes(32).toString("hex");
const adminPassword =
  process.env.ADMIN_PASSWORD || crypto.randomBytes(16).toString("base64url");

const vars = [
  ["DATABASE_URL", process.env.DATABASE_URL, true],
  ["SUPABASE_URL", process.env.SUPABASE_URL || "https://mzzgzcksavtuegamyudg.supabase.co", false],
  ["SUPABASE_SERVICE_ROLE_KEY", process.env.SUPABASE_SERVICE_ROLE_KEY, true],
  ["SESSION_SECRET", sessionSecret, true],
  ["ADMIN_PASSWORD", adminPassword, true],
  ["DATA_ENCRYPTION_KEY", dataEncryptionKey, true],
  ["NEXT_PUBLIC_SITE_URL", process.env.NEXT_PUBLIC_SITE_URL || "https://cfm-asbl.vercel.app", false],
  ["CFM_PG_NORMALIZED", "true", false],
  ["CFM_IMAGE_COMPRESS", "true", false],
  ["CFM_MEDIA_CACHE_TTL", "300", false],
  ["MOBILE_MONEY_MODE", "demo", false],
  ["NEXT_PUBLIC_MOBILE_MONEY_MODE", "demo", false],
  ["SUPABASE_STORAGE_BUCKET", "media-uploads", false],
];

function addEnv(name, value, sensitive) {
  const args = [
    "vercel",
    "env",
    "add",
    name,
    "production",
    "--value",
    value,
    "--yes",
    "--force",
    sensitive ? "--sensitive" : "--no-sensitive",
  ];
  const result = spawnSync("npx", args, { stdio: "inherit", shell: true });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

console.log("→ Ajout des variables Vercel (production)…\n");
for (const [name, , sensitive] of vars) {
  console.log(`  ${name}`);
}
console.log("");
for (const [name, value, sensitive] of vars) {
  addEnv(name, value, sensitive);
}

console.log("\n✓ Variables configurées.");
console.log("→ Redéployez : npx vercel --prod");
console.log("\nConservez ce mot de passe admin (généré si absent) :");
console.log(`  ADMIN_PASSWORD=${adminPassword}`);
if (!process.env.SESSION_SECRET) {
  console.log("  (SESSION_SECRET et DATA_ENCRYPTION_KEY générés — non affichés)");
}
