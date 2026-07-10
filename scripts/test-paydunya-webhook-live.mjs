#!/usr/bin/env node
/**
 * Test live webhook PayDunya — signature valide / invalide
 * Usage: PAYDUNYA_MASTER_KEY=xxx node scripts/test-paydunya-webhook-live.mjs [baseUrl]
 */
const BASE = process.argv[2] || process.env.CFM_E2E_BASE || "http://localhost:3000";
const MASTER = process.env.PAYDUNYA_MASTER_KEY || "test-master-key-32chars-minimum!!";

async function post(body, signature) {
  const headers = { "Content-Type": "application/json" };
  if (signature) headers["PAYDUNYA-SIGNATURE"] = signature;
  const res = await fetch(`${BASE}/api/donations/webhook`, {
    method: "POST",
    headers,
    body,
  });
  return { status: res.status, text: await res.text() };
}

async function main() {
  const rawBody = JSON.stringify({
    status: "pending",
    data: { custom_data: { donation_id: "999999" } },
  });

  console.log(`\n🔐 PayDunya webhook — ${BASE}\n`);

  const noSig = await post(rawBody, "");
  console.log(`Sans signature: ${noSig.status} (attendu 200 si pas de cle prod)`);

  const bad = await post(rawBody, "invalid-signature-hex");
  const badOk = MASTER && process.env.PAYDUNYA_MASTER_KEY ? bad.status === 401 : true;
  console.log(
    badOk ? `✅ Signature invalide: ${bad.status}` : `❌ Signature invalide: ${bad.status} (attendu 401)`
  );

  if (!process.env.PAYDUNYA_MASTER_KEY) {
    console.log("⚠ PAYDUNYA_MASTER_KEY non configure — test 401 skip en local");
    process.exit(0);
  }

  const crypto = await import("crypto");
  const secret = process.env.PAYDUNYA_WEBHOOK_SECRET || MASTER;
  const validSig = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  const good = await post(rawBody, validSig);
  const goodOk = good.status === 200;
  console.log(goodOk ? `✅ Signature valide: ${good.status}` : `❌ Signature valide: ${good.status}`);

  process.exit(badOk && goodOk ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
