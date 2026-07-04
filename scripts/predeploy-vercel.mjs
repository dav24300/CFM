#!/usr/bin/env node
/**
 * Pré-déploiement Vercel + Supabase — vérifie build et variables requises.
 */
import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const root = process.cwd();
let errors = 0;

function check(label, ok, hint = "") {
  if (ok) console.log(`✓ ${label}`);
  else {
    console.error(`✗ ${label}${hint ? ` — ${hint}` : ""}`);
    errors++;
  }
}

check("vercel.json", fs.existsSync(path.join(root, "vercel.json")));
check("docs/DEPLOY-VERCEL-SUPABASE.md", fs.existsSync(path.join(root, "docs/DEPLOY-VERCEL-SUPABASE.md")));

const envExample = fs.readFileSync(path.join(root, ".env.example"), "utf8");
check(".env.example contient SUPABASE_URL", envExample.includes("SUPABASE_URL"));
check(".env.example contient DATABASE_URL", envExample.includes("DATABASE_URL"));

console.log("\n→ Build production…");
try {
  execSync("npm run build", { stdio: "inherit", cwd: root });
  console.log("\n✓ Build OK");
} catch {
  errors++;
  console.error("\n✗ Build échoué");
}

if (errors > 0) {
  console.error(`\n${errors} problème(s). Voir docs/DEPLOY-VERCEL-SUPABASE.md`);
  process.exit(1);
}

console.log("\nProjet prêt pour Vercel. Configurez Supabase puis déployez.");
console.log("Guide : docs/DEPLOY-VERCEL-SUPABASE.md");
