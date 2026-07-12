#!/usr/bin/env node
/**
 * Garde anti-régression — contrôles bruts sur les surfaces publiques.
 *
 * Interdit sur src/app/(site) et src/app/(portail) :
 *   - <button> brut (préférer la primitive <Button> / <ButtonLink>) ;
 *   - couleurs de statut Tailwind brutes (bg-green|red|amber|gray-600|700).
 *
 * Ces surfaces rendent sous .theme-site : les contrôles doivent passer par les
 * primitives thématisables (--control-*), jamais par du Tailwind de statut brut.
 * L'allowlist recense les cas connus encore non migrés (à vider au fil des phases).
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

const ROOT = process.cwd();
const SCOPES = ["src/app/(site)", "src/app/(portail)"];
const RAW_BUTTON = /<button[\s>]/;
const RAW_STATUS = /\bbg-(green|red|amber|gray)-(600|700)\b/;

// Allowlist des fichiers encore non migrés (vide : (site)/(portail) sont clean).
const BUTTON_ALLOWLIST = new Set([]);

function walk(dir) {
  const out = [];
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return out;
  }
  for (const name of entries) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (/\.(t|j)sx?$/.test(name)) out.push(full);
  }
  return out;
}

const violations = [];
for (const scope of SCOPES) {
  for (const file of walk(join(ROOT, scope))) {
    const rel = relative(ROOT, file).split(sep).join("/");
    const lines = readFileSync(file, "utf8").split(/\r?\n/);
    lines.forEach((line, i) => {
      if (RAW_STATUS.test(line)) {
        violations.push(`${rel}:${i + 1}  couleur de statut brute — utiliser un token de statut --control-*`);
      }
      if (RAW_BUTTON.test(line) && !BUTTON_ALLOWLIST.has(rel)) {
        violations.push(`${rel}:${i + 1}  <button> brut — utiliser la primitive <Button> / <ButtonLink>`);
      }
    });
  }
}

if (violations.length) {
  console.error("✖ lint:controls — contrôles bruts interdits sur (site)/(portail) :\n");
  for (const v of violations) console.error("  " + v);
  console.error(
    `\n${violations.length} violation(s). Migrer vers les primitives, ou (temporairement) ajouter à l'allowlist du script.`
  );
  process.exit(1);
}
console.log("✔ lint:controls — aucun contrôle brut sur (site)/(portail).");
