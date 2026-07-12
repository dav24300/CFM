#!/usr/bin/env node
/**
 * Complétude i18n par locale (P3) — les 4 JSON sont la source de vérité.
 * - ÉCHEC (exit 1) si une locale a des clés manquantes ou en trop vs fr
 *   (divergence structurelle : le type Messages ne la couvrirait pas).
 * - INFORMATIF : compte des valeurs identiques au français (traductions
 *   manquantes probables — le repli FR historique, désormais mesurable).
 * Usage : npm run i18n:check [-- --verbose]
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const dir = path.join(root, "src", "lib", "i18n", "messages");
const LOCALES = ["fr", "en", "ln", "sw"];
const verbose = process.argv.includes("--verbose");

function flatten(obj, prefix = "", out = {}) {
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v)) flatten(v, key, out);
    else out[key] = v;
  }
  return out;
}

const dicts = Object.fromEntries(
  LOCALES.map((l) => [l, flatten(JSON.parse(fs.readFileSync(path.join(dir, `${l}.json`), "utf-8")))])
);
const frKeys = new Set(Object.keys(dicts.fr));
let structuralFailure = false;

console.log(`Référence fr : ${frKeys.size} clés\n`);

for (const locale of LOCALES.filter((l) => l !== "fr")) {
  const keys = new Set(Object.keys(dicts[locale]));
  const missing = [...frKeys].filter((k) => !keys.has(k));
  const extra = [...keys].filter((k) => !frKeys.has(k));
  const identical = [...frKeys].filter(
    (k) => keys.has(k) && dicts[locale][k] === dicts.fr[k]
  );

  const pct = (((frKeys.size - identical.length) / frKeys.size) * 100).toFixed(1);
  console.log(
    `${locale} : ${missing.length} manquante(s), ${extra.length} en trop, ` +
      `${identical.length} identique(s) au fr (~${pct}% traduit)`
  );
  if (missing.length || extra.length) {
    structuralFailure = true;
    for (const k of missing.slice(0, 10)) console.log(`   MANQUE ${k}`);
    for (const k of extra.slice(0, 10)) console.log(`   EN TROP ${k}`);
  }
  if (verbose && identical.length) {
    console.log(`   Identiques au fr :`);
    for (const k of identical) console.log(`   = ${k}`);
  }
}

if (structuralFailure) {
  console.log("\n✗ Divergence structurelle entre locales");
  process.exit(1);
}
console.log("\n✓ Structure identique sur les 4 locales (trous de traduction ci-dessus)");
