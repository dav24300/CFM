# Pré-déploiement Netlify — vérifie build et fichiers requis
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

check("data/store.seed.json", fs.existsSync(path.join(root, "data/store.seed.json")));
check("public/media/", fs.existsSync(path.join(root, "public/media")));
check("netlify.toml", fs.existsSync(path.join(root, "netlify.toml")));

const envExample = fs.readFileSync(path.join(root, ".env.example"), "utf8");
check(".env.example contient NEXT_PUBLIC_SITE_URL", envExample.includes("NEXT_PUBLIC_SITE_URL"));

console.log("\n→ Build production…");
try {
  execSync("npm run build:netlify", { stdio: "inherit", cwd: root });
  console.log("\n✓ Build Netlify OK");
} catch {
  errors++;
  console.error("\n✗ Build échoué");
}

if (errors > 0) {
  console.error(`\n${errors} problème(s) — corrigez avant de déployer.`);
  process.exit(1);
}

console.log("\nProjet prêt pour Netlify. Voir DEPLOY-NETLIFY.md");
