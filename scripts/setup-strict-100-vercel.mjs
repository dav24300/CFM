#!/usr/bin/env node
/**
 * Action finale 1 — configure Vercel (Upstash + PayDunya) et redeploie.
 *
 * Usage (cles deja connues) :
 *   UPSTASH_REDIS_REST_URL=... UPSTASH_REDIS_REST_TOKEN=... \
 *   PAYDUNYA_MASTER_KEY=... PAYDUNYA_PRIVATE_KEY=... PAYDUNYA_TOKEN=... \
 *   PAYDUNYA_WEBHOOK_SECRET=... \
 *   node scripts/setup-strict-100-vercel.mjs
 *
 * Ou provisionner Upstash via API :
 *   UPSTASH_EMAIL=... UPSTASH_API_KEY=... node scripts/setup-strict-100-vercel.mjs
 */
import { spawnSync } from "child_process";
import crypto from "crypto";

const PROD_URL = process.env.CFM_PREPROD_URL || "https://cfm-asbl.vercel.app";

function run(cmd, args, opts = {}) {
  const result = spawnSync(cmd, args, { stdio: "inherit", shell: true, ...opts });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

async function provisionUpstash() {
  const email = process.env.UPSTASH_EMAIL?.trim();
  const apiKey = process.env.UPSTASH_API_KEY?.trim();
  if (!email || !apiKey) return null;

  const auth = Buffer.from(`${email}:${apiKey}`).toString("base64");
  const body = {
    name: `cfm-asbl-${Date.now()}`,
    region: "eu-west-1",
    tls: true,
    multizone: false,
  };

  console.log("→ Creation base Redis Upstash (eu-west-1)…");
  const res = await fetch("https://api.upstash.com/v2/redis/database", {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error(`✗ Upstash API ${res.status}: ${text.slice(0, 300)}`);
    process.exit(1);
  }

  const db = await res.json();
  const url = db.rest_token ? db.endpoint : db.rest_url || db.endpoint;
  const token = db.rest_token || db.token;
  if (!url || !token) {
    console.error("✗ Reponse Upstash sans REST URL/token:", Object.keys(db));
    process.exit(1);
  }

  const restUrl = String(url).startsWith("http") ? url : `https://${url}`;
  console.log("✓ Redis Upstash cree");
  return { url: restUrl, token };
}

function addEnv(name, value, sensitive = true) {
  run("npx", [
    "vercel",
    "env",
    "add",
    name,
    "production",
    "--value",
    value,
    "--yes",
    "--force",
    sensitive ? "--sensitive" : "--no-sensitive",
  ]);
}

async function main() {
  let redisUrl = process.env.UPSTASH_REDIS_REST_URL?.trim();
  let redisToken = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();

  if (!redisUrl || !redisToken) {
    const provisioned = await provisionUpstash();
    if (provisioned) {
      redisUrl = provisioned.url;
      redisToken = provisioned.token;
    }
  }

  const payVars = [
    "PAYDUNYA_MASTER_KEY",
    "PAYDUNYA_PRIVATE_KEY",
    "PAYDUNYA_TOKEN",
    "PAYDUNYA_WEBHOOK_SECRET",
  ];
  const missingPay = payVars.filter((k) => !process.env[k]?.trim());

  console.log("\n→ Configuration Vercel production…\n");

  if (redisUrl && redisToken) {
    addEnv("UPSTASH_REDIS_REST_URL", redisUrl);
    addEnv("UPSTASH_REDIS_REST_TOKEN", redisToken);
  } else {
    console.warn("⚠ UPSTASH_* absent — rate limit distribue non configure");
  }

  if (!missingPay.length) {
    for (const k of payVars) addEnv(k, process.env[k].trim());
    addEnv("MOBILE_MONEY_MODE", "production", false);
    addEnv("NEXT_PUBLIC_MOBILE_MONEY_MODE", "production", false);
  } else {
    console.warn(`⚠ PayDunya incomplet (${missingPay.join(", ")}) — mode demo conserve`);
  }

  console.log("\n→ Deploiement production Vercel…\n");
  run("npx", ["vercel", "--prod", "--yes"]);

  console.log("\n→ Verification post-deploy…\n");
  await new Promise((r) => setTimeout(r, 15000));

  const health = await fetch(`${PROD_URL}/api/health`, { cache: "no-store" });
  const healthJson = await health.json().catch(() => ({}));
  console.log("Health:", JSON.stringify(healthJson, null, 2));

  const home = await fetch(PROD_URL);
  const csp = home.headers.get("content-security-policy") || "";
  console.log("CSP unsafe-eval:", csp.includes("unsafe-eval") ? "PRESENT" : "absent");

  console.log("\n→ Validation stricte (post-deploy)…\n");
  const validation = spawnSync("node", ["scripts/validate-strict-100.mjs", PROD_URL], {
    stdio: "inherit",
    shell: true,
    env: process.env,
  });

  console.log("\n--- Resume ---");
  console.log("Deploy: OK");
  if (validation.status === 0) {
    console.log("Validation: OK (8/8)");
    process.exit(0);
  }
  console.log(`Validation: ECHEC (exit ${validation.status ?? 1}) — voir checks ci-dessus`);
  console.log("Le deploy production a reussi ; corriger les blockers validation puis relancer validate-strict-100.");
  process.exit(2);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
