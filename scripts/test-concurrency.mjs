#!/usr/bin/env node
/**
 * Test de concurrence — preuve du lost update (refactor persistance P1).
 *
 * Scénario A (intra-agrégat) : N signatures parallèles sur une pétition jetable.
 *   Avant refactor : < N persistées (clone du Store + réécriture totale).
 *   Après refactor : N/N persistées, 0 violation d'unicité.
 * Scénario B (inter-agrégats) : 1 signature ‖ 1 inscription newsletter.
 *   Avant : l'une des deux écritures peut disparaître. Après : les deux persistent.
 *
 * Usage:
 *   node scripts/test-concurrency.mjs [--runs 5] [--allow-loss] [--base http://localhost:3000]
 *   --allow-loss : mode baseline AVANT (documente les pertes, exit 0)
 *   défaut : mode gate — toute perte = exit 1
 *
 * Requiert : serveur dev démarré, ADMIN_PASSWORD et DATABASE_URL (env ou .env.local).
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import pg from "pg";

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
function argValue(flag, fallback) {
  const i = args.indexOf(flag);
  return i !== -1 && args[i + 1] ? args[i + 1] : fallback;
}
const base = argValue("--base", process.env.SMOKE_BASE_URL || "http://localhost:3000");
const runs = Number(argValue("--runs", "5"));
const allowLoss = args.includes("--allow-loss");
const PARALLEL_SIGNATURES = 10;

const password = loadEnvVar("ADMIN_PASSWORD");
const databaseUrl = loadEnvVar("DATABASE_URL");
if (!password) {
  console.error("❌ ADMIN_PASSWORD manquant (env ou .env.local)");
  process.exit(1);
}

const pool = databaseUrl
  ? new pg.Pool({ connectionString: databaseUrl, connectionTimeoutMillis: 5000 })
  : null;
if (!pool) console.log("⚠ DATABASE_URL absent — vérification via API uniquement");

async function adminLogin() {
  const res = await fetch(`${base}/api/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ password }),
  });
  if (res.status !== 200) throw new Error(`login admin: ${res.status}`);
  return (res.headers.get("set-cookie") || "").split(";")[0];
}

async function createPetition(cookie, tag) {
  const res = await fetch(`${base}/api/admin/petitions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({
      title: `Test concurrence ${tag}`,
      description: "Pétition jetable de test — supprimée automatiquement",
      goal: 1000,
    }),
  });
  const body = await res.json();
  if (res.status !== 200 || !body.petition) throw new Error(`create petition: ${res.status}`);
  return body.petition;
}

async function deletePetition(cookie, id) {
  await fetch(`${base}/api/admin/petitions/${id}`, {
    method: "DELETE",
    headers: { Cookie: cookie },
  }).catch(() => {});
}

async function sign(slug, email) {
  const res = await fetch(`${base}/api/petitions/${slug}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: `Testeur ${email}`, email }),
  });
  return res.status;
}

async function subscribeNewsletter(email) {
  const res = await fetch(`${base}/api/newsletter`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  return res.status;
}

async function dbCount(sql, params) {
  if (!pool) return null;
  const res = await pool.query(sql, params);
  return res.rows[0] ? Number(res.rows[0].n) : 0;
}

async function apiSignatureCount(slug) {
  const res = await fetch(`${base}/api/petitions/${slug}`);
  if (res.status !== 200) return null;
  const body = await res.json();
  return body.signatures_count ?? body.petition?.signatures_count ?? null;
}

let totalLossA = 0;
let totalLossB = 0;
const cookie = await adminLogin();

for (let run = 1; run <= runs; run++) {
  const tag = `${Date.now()}-${run}`;
  const petition = await createPetition(cookie, tag);

  // Scénario A : N signatures parallèles
  const emails = Array.from({ length: PARALLEL_SIGNATURES }, (_, i) => `c${i}-${tag}@test-concurrence.local`);
  const statuses = await Promise.all(emails.map((e) => sign(petition.slug, e)));
  const accepted = statuses.filter((s) => s === 200).length;
  // laisse le serveur retomber avant lecture
  await new Promise((r) => setTimeout(r, 500));
  const inDb = pool
    ? await dbCount(`SELECT COUNT(*)::int AS n FROM petition_signatures WHERE petition_id = $1`, [petition.id])
    : await apiSignatureCount(petition.slug);
  const lossA = accepted - (inDb ?? 0);
  if (lossA > 0) totalLossA += lossA;
  console.log(
    `Run ${run} — A: ${accepted}/${PARALLEL_SIGNATURES} acceptées (HTTP), ${inDb ?? "?"} persistées ${lossA > 0 ? `→ PERTE ${lossA}` : "✓"}`
  );

  // Scénario B : signature ‖ newsletter
  const sigEmail = `b-sig-${tag}@test-concurrence.local`;
  const nlEmail = `b-nl-${tag}@test-concurrence.local`;
  const [sigStatus, nlStatus] = await Promise.all([
    sign(petition.slug, sigEmail),
    subscribeNewsletter(nlEmail),
  ]);
  await new Promise((r) => setTimeout(r, 500));
  const sigPersisted = pool
    ? (await dbCount(`SELECT COUNT(*)::int AS n FROM petition_signatures WHERE email = $1`, [sigEmail])) > 0
    : null;
  const nlPersisted = pool
    ? (await dbCount(`SELECT COUNT(*)::int AS n FROM newsletter WHERE email = $1`, [nlEmail])) > 0
    : null;
  const lossB =
    (sigStatus === 200 && sigPersisted === false ? 1 : 0) +
    (nlStatus === 200 && nlPersisted === false ? 1 : 0);
  if (lossB > 0) totalLossB += lossB;
  console.log(
    `Run ${run} — B: signature ${sigStatus}/${sigPersisted === null ? "?" : sigPersisted ? "persistée" : "PERDUE"}, newsletter ${nlStatus}/${nlPersisted === null ? "?" : nlPersisted ? "persistée" : "PERDUE"}`
  );

  await deletePetition(cookie, petition.id);
  if (pool) {
    await pool.query(`DELETE FROM newsletter WHERE email LIKE '%@test-concurrence.local'`).catch(() => {});
    await pool.query(`DELETE FROM petition_signatures WHERE email LIKE '%@test-concurrence.local'`).catch(() => {});
  }
}

if (pool) await pool.end();

const totalLoss = totalLossA + totalLossB;
console.log(`\nRésultat : ${totalLoss} écriture(s) perdue(s) sur ${runs} run(s) (A: ${totalLossA}, B: ${totalLossB})`);
if (totalLoss > 0 && !allowLoss) {
  console.log("✗ Lost updates détectés — gate en échec");
  process.exit(1);
}
console.log(totalLoss === 0 ? "✓ Aucune perte" : "⚠ Pertes documentées (mode --allow-loss)");
process.exit(0);
