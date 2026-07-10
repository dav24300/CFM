#!/usr/bin/env node
/**
 * Actions finales strict 100 % — orchestre deploy Vercel + monitoring 48h/72h.
 *
 * Usage:
 *   node scripts/execute-strict-100-final.mjs
 *
 * Variables optionnelles: UPSTASH_*, PAYDUNYA_*, CFM_PREPROD_URL
 */
import { spawn, spawnSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const BASE = process.argv[2] || process.env.CFM_PREPROD_URL || "https://cfm-asbl.vercel.app";
const logDir = path.join(root, "data");
const log48 = path.join(logDir, "monitor-48h.log");
const log72 = path.join(logDir, "monitor-72h.log");

function runSync(cmd, args) {
  const r = spawnSync(cmd, args, { cwd: root, stdio: "inherit", shell: true });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

function startMonitor(hours, logFile) {
  fs.mkdirSync(logDir, { recursive: true });
  const out = fs.openSync(logFile, "a");
  const child = spawn(
    process.execPath,
    ["scripts/monitor-stability.mjs", BASE, String(hours)],
    { cwd: root, stdio: ["ignore", out, out], detached: true }
  );
  child.unref();
  fs.writeFileSync(
    path.join(logDir, `monitor-${hours}h.pid`),
    String(child.pid),
    "utf8"
  );
  console.log(`📡 Monitor ${hours}h demarre (PID ${child.pid}) → ${logFile}`);
  return child.pid;
}

console.log(`\n🎯 Actions finales strict 100 % — ${BASE}\n`);

console.log("=== Action 1 : Vercel (env + deploy) ===\n");
runSync("node", ["scripts/setup-strict-100-vercel.mjs"]);

console.log("\n=== Action 2 : Monitoring 48h puis 72h ===\n");
startMonitor(48, log48);
startMonitor(72, log72);

console.log(`
Suivi:
  tail -f data/monitor-48h.log
  tail -f data/monitor-72h.log

Revalidation apres 72h:
  node scripts/validate-strict-100.mjs ${BASE}
`);
