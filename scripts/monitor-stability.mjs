#!/usr/bin/env node
/**
 * Monitoring preprod/prod — sante toutes les 5 min (48h / 72h)
 * Usage: node scripts/monitor-stability.mjs [url] [hours]
 * Exemple 48h: node scripts/monitor-stability.mjs https://cfm-asbl.vercel.app 48
 */
const BASE = process.argv[2] || process.env.CFM_PREPROD_URL || "https://cfm-asbl.vercel.app";
const HOURS = parseFloat(process.argv[3] || "0.05"); // defaut ~3 min pour demo
const INTERVAL_MS = 5 * 60 * 1000;
const END = Date.now() + HOURS * 60 * 60 * 1000;

const checks = ["/api/health", "/", "/contact", "/admin"];

async function tick() {
  const ts = new Date().toISOString();
  let fail = 0;
  for (const path of checks) {
    try {
      const res = await fetch(`${BASE}${path}`, { redirect: "manual" });
      const ok = res.status < 500;
      if (!ok) fail++;
      console.log(`${ts} ${ok ? "OK" : "FAIL"} ${res.status} ${path}`);
    } catch (e) {
      fail++;
      console.log(`${ts} ERR ${path} ${e.message}`);
    }
  }
  return fail === 0;
}

console.log(`\n📡 Monitor ${BASE} — ${HOURS}h (intervalle 5 min)\n`);

let consecutiveOk = 0;
while (Date.now() < END) {
  const ok = await tick();
  if (ok) consecutiveOk++;
  else consecutiveOk = 0;
  if (Date.now() + INTERVAL_MS > END) break;
  await new Promise((r) => setTimeout(r, INTERVAL_MS));
}

console.log(`\n--- Fin monitor: ${consecutiveOk} cycles OK consecutifs ---\n`);
process.exit(0);
