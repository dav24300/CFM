#!/usr/bin/env node
/** V2 restant — dons E8, newsletter delete, contact archive */
const BASE = process.env.CFM_E2E_BASE || "http://localhost:3000";
const PASSWORD = process.env.ADMIN_PASSWORD || "admin123";
const TAG = `v2-${Date.now()}`;

let cookie = "";
const results = [];

function log(ok, name, detail = "") {
  results.push({ ok, name, detail });
  console.log(`${ok ? "✅" : "❌"} ${name}${detail ? ` — ${detail}` : ""}`);
}

async function api(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  if (cookie) headers.Cookie = cookie;
  if (options.body) headers["Content-Type"] = "application/json";
  return fetch(`${BASE}${path}`, { ...options, headers });
}

async function login() {
  const res = await api("/api/admin/login", {
    method: "POST",
    body: JSON.stringify({ password: PASSWORD }),
  });
  const cookies = res.headers.getSetCookie?.() || [];
  const c = cookies.find((x) => x.startsWith("cfm_admin_session="));
  if (!res.ok || !c) throw new Error("login failed");
  cookie = c.split(";")[0];
}

async function testDonorsPublic() {
  await api("/api/donations", {
    method: "POST",
    body: JSON.stringify({
      amount: 5,
      currency: "USD",
      provider: "mpesa",
      phone: "+243900000002",
      donor_name: `Public ${TAG}`,
    }),
  });
  await api("/api/admin/settings", {
    method: "PATCH",
    body: JSON.stringify({ settings: { donors_public: "1" } }),
  });
  const res = await fetch(`${BASE}/s-engager`);
  const html = await res.text();
  const ok = res.ok && html.includes("Derniers dons");
  log(ok, "E8 — toggle donateurs publics", ok ? "liste visible" : "liste absente");
  await api("/api/admin/settings", {
    method: "PATCH",
    body: JSON.stringify({ settings: { donors_public: "0" } }),
  });
}

async function testNewsletterDelete() {
  const email = `test-${TAG}@example.com`;
  const sub = await api("/api/newsletter", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
  if (!sub.ok) {
    log(false, "Newsletter subscribe", String(sub.status));
    return;
  }
  const dataRes = await api("/api/admin/data");
  const data = await dataRes.json();
  const row = (data.newsletter || []).find((n) => n.email === email);
  if (!row) {
    log(false, "Newsletter — trouver abonné");
    return;
  }
  const del = await api(`/api/admin/newsletter/${row.id}`, { method: "DELETE" });
  const data2 = await (await api("/api/admin/data")).json();
  const still = (data2.newsletter || []).some((n) => n.id === row.id);
  log(del.ok && !still, "Newsletter — retrait admin");
}

async function testDonationReconcile() {
  const create = await api("/api/donations", {
    method: "POST",
    body: JSON.stringify({
      amount: 10,
      currency: "USD",
      provider: "orange",
      phone: "+243900000001",
      donor_name: `Donateur ${TAG}`,
      donor_email: `don-${TAG}@example.com`,
    }),
  });
  if (!create.ok) {
    log(false, "Don création", String(create.status));
    return;
  }
  const body = await create.json();
  const donationId = body.donation?.id;
  if (!donationId) {
    log(false, "Don — id manquant");
    return;
  }
  const patch = await api(`/api/admin/donations/${donationId}`, {
    method: "PATCH",
    body: JSON.stringify({
      transaction_id: `TEST-${TAG}`,
      send_receipt: false,
    }),
  });
  const data = await (await api("/api/admin/data")).json();
  const d = (data.donations || []).find((x) => x.id === donationId);
  log(patch.ok && d?.transaction_id === `TEST-${TAG}`, "Dons — réconciliation réf. transaction");
}

async function main() {
  console.log(`\n📋 V2 finalisation — ${BASE}\n`);
  await login();
  log(true, "Login admin");
  await testDonorsPublic();
  await testNewsletterDelete();
  await testDonationReconcile();
  const ok = results.filter((r) => r.ok).length;
  console.log(`\n--- V2: ${ok}/${results.length} ---\n`);
  process.exit(ok === results.length ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
