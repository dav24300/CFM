#!/usr/bin/env node
/**
 * Déploiement VPS — build standalone + instructions Docker.
 * Usage: node scripts/deploy-vps.mjs
 */
import { execSync } from "child_process";

console.log("→ Build production CFM ASBL…");
execSync("npm run build", { stdio: "inherit" });

console.log("\n✓ Build terminé. Déploiement Docker :");
console.log("  docker compose -f docker-compose.prod.yml up -d --build");
console.log("\nOu manuellement :");
console.log("  node .next/standalone/server.js");
console.log("\nVariables obligatoires : DATABASE_URL, SESSION_SECRET, ADMIN_PASSWORD, DATA_ENCRYPTION_KEY");
