#!/usr/bin/env node
/**
 * Configure les variables Vercel production (cfm-asbl).
 * Usage:
 *   DATABASE_URL="postgresql://..." SUPABASE_SERVICE_ROLE_KEY="..." node scripts/setup-vercel-env.mjs
 * Les secrets manquants sont générés automatiquement.
 */
import { spawnSync } from "child_process";
import crypto from "crypto";

// SUPABASE_URL est requis explicitement : plus de valeur par défaut codée en dur
// (source d'incohérence entre environnements). Le vrai projet Supabase doit être fourni.
const required = ["DATABASE_URL", "SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"];
const missing = required.filter((k) => !process.env[k]?.trim());
if (missing.length) {
  console.error(`Variables requises manquantes : ${missing.join(", ")}`);
  console.error("Exemple :");
  console.error(
    '  DATABASE_URL="postgresql://postgres.[ref]:[pwd]@...pooler.supabase.com:6543/postgres" \\',
  );
  console.error('  SUPABASE_URL="https://[ref].supabase.co" \\');
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

// Chaque entrée : [name, value, sensitive, optional]
// Les variables optionnelles vides sont ignorées (provisioning incrémental).
const env = (k) => process.env[k]?.trim() || "";
const vars = [
  // --- Obligatoire runtime ---
  ["SESSION_SECRET", sessionSecret, true, false],
  ["ADMIN_PASSWORD", adminPassword, true, false],
  ["DATA_ENCRYPTION_KEY", dataEncryptionKey, true, false],
  // --- Persistance Supabase ---
  ["DATABASE_URL", process.env.DATABASE_URL, true, false],
  ["SUPABASE_URL", process.env.SUPABASE_URL, false, false],
  ["SUPABASE_SERVICE_ROLE_KEY", process.env.SUPABASE_SERVICE_ROLE_KEY, true, false],
  ["SUPABASE_STORAGE_BUCKET", env("SUPABASE_STORAGE_BUCKET") || "media-uploads", false, false],
  ["CFM_PG_NORMALIZED", "true", false, false],
  // --- Site ---
  ["NEXT_PUBLIC_SITE_URL", process.env.NEXT_PUBLIC_SITE_URL || "https://cfm-asbl.vercel.app", false, false],
  ["NEXT_PUBLIC_CONTACT_PHONE", env("NEXT_PUBLIC_CONTACT_PHONE"), false, true],
  // --- Paiements (PayDunya) ---
  ["MOBILE_MONEY_MODE", env("MOBILE_MONEY_MODE") || "demo", false, false],
  ["NEXT_PUBLIC_MOBILE_MONEY_MODE", env("NEXT_PUBLIC_MOBILE_MONEY_MODE") || "demo", false, false],
  ["PAYDUNYA_MASTER_KEY", env("PAYDUNYA_MASTER_KEY"), true, true],
  ["PAYDUNYA_PRIVATE_KEY", env("PAYDUNYA_PRIVATE_KEY"), true, true],
  ["PAYDUNYA_TOKEN", env("PAYDUNYA_TOKEN"), true, true],
  ["PAYDUNYA_WEBHOOK_SECRET", env("PAYDUNYA_WEBHOOK_SECRET"), true, true],
  // --- Temps réel (Pusher) ---
  ["PUSHER_APP_ID", env("PUSHER_APP_ID"), true, true],
  ["PUSHER_KEY", env("PUSHER_KEY"), true, true],
  ["PUSHER_SECRET", env("PUSHER_SECRET"), true, true],
  ["PUSHER_CLUSTER", env("PUSHER_CLUSTER") || "eu", false, true],
  ["NEXT_PUBLIC_PUSHER_KEY", env("NEXT_PUBLIC_PUSHER_KEY"), false, true],
  ["NEXT_PUBLIC_PUSHER_CLUSTER", env("NEXT_PUBLIC_PUSHER_CLUSTER") || "eu", false, true],
  // --- Web Push (VAPID) ---
  ["VAPID_PUBLIC_KEY", env("VAPID_PUBLIC_KEY"), true, true],
  ["VAPID_PRIVATE_KEY", env("VAPID_PRIVATE_KEY"), true, true],
  ["NEXT_PUBLIC_VAPID_PUBLIC_KEY", env("NEXT_PUBLIC_VAPID_PUBLIC_KEY"), false, true],
  ["VAPID_SUBJECT", env("VAPID_SUBJECT"), false, true],
  // --- Email SMTP ---
  ["SMTP_HOST", env("SMTP_HOST"), false, true],
  ["SMTP_PORT", env("SMTP_PORT") || "587", false, true],
  ["SMTP_SECURE", env("SMTP_SECURE") || "false", false, true],
  ["SMTP_USER", env("SMTP_USER"), true, true],
  ["SMTP_PASS", env("SMTP_PASS"), true, true],
  ["SMTP_FROM", env("SMTP_FROM"), false, true],
  ["CFM_REQUIRE_SMTP", env("CFM_REQUIRE_SMTP"), false, true],
  // --- Rate limit distribué (Upstash Redis) ---
  ["UPSTASH_REDIS_REST_URL", env("UPSTASH_REDIS_REST_URL"), true, true],
  ["UPSTASH_REDIS_REST_TOKEN", env("UPSTASH_REDIS_REST_TOKEN"), true, true],
  // --- Réglages ---
  ["CFM_IMAGE_COMPRESS", "true", false, false],
  ["CFM_MEDIA_CACHE_TTL", "300", false, false],
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

const toSet = vars.filter(([, value, , optional]) => !(optional && !String(value ?? "").trim()));
const skipped = vars.filter(([, value, , optional]) => optional && !String(value ?? "").trim());

console.log("→ Ajout des variables Vercel (production)…\n");
for (const [name] of toSet) {
  console.log(`  ${name}`);
}
if (skipped.length) {
  console.log("\n  (ignorées — optionnelles non fournies) :");
  for (const [name] of skipped) console.log(`    ${name}`);
}
console.log("");
for (const [name, value, sensitive] of toSet) {
  addEnv(name, value, sensitive);
}

console.log("\n✓ Variables configurées.");
console.log("→ Redéployez : npx vercel --prod");
console.log("\nConservez ce mot de passe admin (généré si absent) :");
console.log(`  ADMIN_PASSWORD=${adminPassword}`);
if (!process.env.SESSION_SECRET) {
  console.log("  (SESSION_SECRET et DATA_ENCRYPTION_KEY générés — non affichés)");
}
