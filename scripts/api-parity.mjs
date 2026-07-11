#!/usr/bin/env node
/**
 * Parité API — capture puis diff des payloads JSON (refactor persistance P1).
 * La baseline est capturée avant le chantier ; chaque gate rejoue `diff` et
 * doit produire zéro écart (mêmes codes HTTP, mêmes formes JSON).
 *
 * Usage:
 *   node scripts/api-parity.mjs capture [--out docs/refactor-baseline/api] [--base http://localhost:3000]
 *   node scripts/api-parity.mjs diff    [--out docs/refactor-baseline/api] [--base http://localhost:3000]
 *
 * ADMIN_PASSWORD est lu depuis l'env ou .env.local (comme backup-restore-pg-test.mjs).
 * À exécuter AVANT les e2e mutateurs (mêmes données de part et d'autre du diff).
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

function loadEnvVar(name) {
  if (process.env[name]) return process.env[name];
  const envPath = path.join(root, ".env.local");
  if (!fs.existsSync(envPath)) return null;
  const line = fs
    .readFileSync(envPath, "utf8")
    .split("\n")
    .find((l) => l.startsWith(`${name}=`) && !l.startsWith("#"));
  if (!line) return null;
  return line.replace(`${name}=`, "").trim().replace(/^["']|["']$/g, "");
}

const args = process.argv.slice(2);
const mode = args[0];
if (mode !== "capture" && mode !== "diff") {
  console.error("Usage: node scripts/api-parity.mjs <capture|diff> [--out dir] [--base url]");
  process.exit(1);
}
function argValue(flag, fallback) {
  const i = args.indexOf(flag);
  return i !== -1 && args[i + 1] ? args[i + 1] : fallback;
}
const outDir = path.resolve(root, argValue("--out", "docs/refactor-baseline/api"));
const base = argValue("--base", process.env.SMOKE_BASE_URL || "http://localhost:3000");

// Clés volatiles masquées avant comparaison (timestamps, jetons).
const VOLATILE_KEY =
  /(_at|_seen_at|timestamp|token|expires|exported)$/i;

function normalize(value) {
  if (Array.isArray(value)) return value.map(normalize);
  if (value && typeof value === "object") {
    const out = {};
    for (const key of Object.keys(value).sort()) {
      out[key] = VOLATILE_KEY.test(key) && value[key] != null ? "<volatile>" : normalize(value[key]);
    }
    return out;
  }
  return value;
}

async function adminCookie() {
  const password = loadEnvVar("ADMIN_PASSWORD");
  if (!password) return null;
  const res = await fetch(`${base}/api/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ password }),
  });
  if (res.status !== 200) {
    console.error(`⚠ Login admin impossible (${res.status}) — endpoints admin ignorés`);
    return null;
  }
  const setCookie = res.headers.get("set-cookie") || "";
  return setCookie.split(";")[0] || null;
}

const PUBLIC_ENDPOINTS = [
  "/api/health",
  "/api/actions",
  "/api/petitions",
  "/api/petitions/reforme-protection-familles",
  "/api/live",
  "/api/live/fikin-2025",
  "/api/live/fikin-2025/chat",
  "/api/live/fikin-2025/polls",
  "/api/push/vapid",
];

const ADMIN_ENDPOINTS = [
  "/api/admin/data",
  "/api/admin/stats",
  "/api/admin/stats/activity",
  "/api/admin/news",
  "/api/admin/petitions",
  "/api/admin/live",
  "/api/admin/users",
  "/api/admin/partners",
  "/api/admin/settings",
  "/api/admin/studies",
  "/api/admin/campaigns",
  "/api/admin/press-releases",
  "/api/admin/testimonials",
  "/api/admin/i18n",
  "/api/admin/media",
  "/api/admin/media/library",
  "/api/admin/media/collections",
  "/api/admin/media/missing",
];

function fileNameFor(endpoint) {
  return endpoint.replace(/^\/api\//, "").replace(/\//g, "__") + ".json";
}

async function captureOne(endpoint, cookie) {
  const headers = { Accept: "application/json" };
  if (cookie) headers.Cookie = cookie;
  try {
    const res = await fetch(`${base}${endpoint}`, { headers, redirect: "manual" });
    const text = await res.text();
    let body;
    try {
      body = normalize(JSON.parse(text));
    } catch {
      body = `<non-json:${text.length} chars>`;
    }
    return { endpoint, status: res.status, body };
  } catch (err) {
    return { endpoint, status: "ERR", body: String(err.message) };
  }
}

async function captureAll() {
  const cookie = await adminCookie();
  const snapshots = [];
  for (const ep of PUBLIC_ENDPOINTS) snapshots.push(await captureOne(ep, null));
  if (cookie) {
    for (const ep of ADMIN_ENDPOINTS) snapshots.push(await captureOne(ep, cookie));
  }
  return snapshots;
}

function diffPaths(a, b, prefix = "", out = []) {
  if (out.length >= 10) return out;
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) {
      out.push(`${prefix}: longueur ${a.length} → ${b.length}`);
      return out;
    }
    a.forEach((v, i) => diffPaths(v, b[i], `${prefix}[${i}]`, out));
    return out;
  }
  if (a && b && typeof a === "object" && typeof b === "object") {
    for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) {
      if (!(k in a)) out.push(`${prefix}.${k}: clé ajoutée`);
      else if (!(k in b)) out.push(`${prefix}.${k}: clé supprimée`);
      else diffPaths(a[k], b[k], `${prefix}.${k}`, out);
      if (out.length >= 10) return out;
    }
    return out;
  }
  if (JSON.stringify(a) !== JSON.stringify(b)) {
    out.push(`${prefix}: ${JSON.stringify(a)} → ${JSON.stringify(b)}`);
  }
  return out;
}

const snapshots = await captureAll();

if (mode === "capture") {
  fs.mkdirSync(outDir, { recursive: true });
  for (const snap of snapshots) {
    fs.writeFileSync(
      path.join(outDir, fileNameFor(snap.endpoint)),
      JSON.stringify(snap, null, 2)
    );
  }
  console.log(`✅ Baseline capturée : ${snapshots.length} endpoints → ${outDir}`);
  process.exit(0);
}

// diff
let failures = 0;
for (const snap of snapshots) {
  const file = path.join(outDir, fileNameFor(snap.endpoint));
  if (!fs.existsSync(file)) {
    console.log(`SKIP ${snap.endpoint} — pas de baseline`);
    continue;
  }
  const baselineSnap = JSON.parse(fs.readFileSync(file, "utf8"));
  if (baselineSnap.status !== snap.status) {
    failures++;
    console.log(`FAIL ${snap.endpoint} — statut ${baselineSnap.status} → ${snap.status}`);
    continue;
  }
  const diffs = diffPaths(baselineSnap.body, snap.body);
  if (diffs.length > 0) {
    failures++;
    console.log(`FAIL ${snap.endpoint}`);
    for (const d of diffs) console.log(`   ${d}`);
  } else {
    console.log(`OK   ${snap.endpoint}`);
  }
}
console.log(failures === 0 ? "\n✓ Parité API : aucun écart" : `\n✗ ${failures} endpoint(s) divergent(s)`);
process.exit(failures === 0 ? 0 : 1);
