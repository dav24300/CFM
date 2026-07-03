#!/usr/bin/env node
/**
 * Smoke test — routes publiques CFM (Phase 0 Corrective.md)
 * Usage: node scripts/smoke-routes.mjs [baseUrl]
 */
const base = process.argv[2] || process.env.SMOKE_BASE_URL || "http://localhost:3000";

const routes = [
  { path: "/", expect: 200 },
  { path: "/a-propos", expect: 200 },
  { path: "/axes", expect: 200 },
  { path: "/plaidoyer", expect: 200 },
  { path: "/actions", expect: 200 },
  { path: "/petitions", expect: 200 },
  { path: "/petitions/reforme-protection-familles", expect: 200 },
  { path: "/live", expect: 200 },
  { path: "/live/fikin-2025", expect: 200 },
  { path: "/s-engager", expect: 200 },
  { path: "/presse", expect: 200 },
  { path: "/contact", expect: 200 },
  { path: "/mentions-legales", expect: 200 },
  { path: "/confidentialite", expect: 200 },
  { path: "/actualites/rassemblement-fikin-2025", expect: 200 },
  { path: "/membre/inscription", expect: 200 },
  { path: "/membre/mot-de-passe-oublie", expect: 200 },
  { path: "/membre/reinitialiser-mot-de-passe", expect: 200 },
  { path: "/membre/tableau-de-bord", expect: 307 },
  { path: "/admin", expect: 200 },
  { path: "/admin/dashboard", expect: 307 },
];

let failed = 0;

async function check(route) {
  const url = `${base}${route.path}`;
  try {
    const res = await fetch(url, { redirect: "manual" });
    const ok = res.status === route.expect;
    const tag = ok ? "OK" : "FAIL";
    if (!ok) failed++;
    console.log(`${tag} ${res.status} (expected ${route.expect}) ${route.path}`);
    return ok;
  } catch (err) {
    failed++;
    console.log(`FAIL ERR ${route.path} — ${err.message}`);
    return false;
  }
}

console.log(`Smoke test CFM → ${base}\n`);

for (const route of routes) {
  await check(route);
}

// Axes stability: 10 consecutive requests
console.log("\nStability /axes (10x):");
let axesFail = 0;
for (let i = 0; i < 10; i++) {
  const res = await fetch(`${base}/axes`, { redirect: "manual" });
  if (res.status !== 200) axesFail++;
}
if (axesFail > 0) {
  console.log(`FAIL ${axesFail}/10 non-200 on /axes`);
  failed += axesFail;
} else {
  console.log("OK 10/10 on /axes");
}

// API petition validation
console.log("\nAPI POST /api/petitions/reforme-protection-familles (empty body):");
const apiRes = await fetch(`${base}/api/petitions/reforme-protection-familles`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: "{}",
});
if (apiRes.status === 400) {
  console.log("OK 400 invalid petition body");
} else {
  console.log(`FAIL ${apiRes.status} (expected 400)`);
  failed++;
}

console.log(failed === 0 ? "\n✓ All smoke tests passed" : `\n✗ ${failed} failure(s)`);
process.exit(failed === 0 ? 0 : 1);
