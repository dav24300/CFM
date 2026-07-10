#!/usr/bin/env node
/** E6 — pétition publish/unpublish admin → /petitions */
const BASE = process.env.CFM_E2E_BASE || "http://localhost:3000";
const PASSWORD = process.env.ADMIN_PASSWORD || "admin123";
const TAG = `v2-pet-${Date.now()}`;

let cookie = "";

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

async function pageHas(text) {
  const res = await fetch(`${BASE}/petitions`);
  const html = await res.text();
  return res.ok && html.includes(text);
}

async function main() {
  console.log(`\n📋 Test V2 E6 pétitions — ${BASE}\n`);
  await login();

  const title = `Pétition ${TAG}`;
  const createRes = await api("/api/admin/petitions", {
    method: "POST",
    body: JSON.stringify({ title, description: "Test V2", goal: 50 }),
  });
  if (!createRes.ok) throw new Error(`create ${createRes.status}`);
  const { petition } = await createRes.json();
  console.log(`✅ Créée id=${petition.id}`);

  await api("/api/admin/preview", { method: "POST", body: JSON.stringify({ tags: ["cfm:petitions"] }) });
  if (!(await pageHas(title))) throw new Error("pétition absente après publish");
  console.log("✅ Visible sur /petitions");

  const depub = await api(`/api/admin/petitions/${petition.id}`, {
    method: "PATCH",
    body: JSON.stringify({ active: 0 }),
  });
  if (!depub.ok) throw new Error(`depublish ${depub.status}`);

  await api("/api/admin/preview", { method: "POST", body: JSON.stringify({ tags: ["cfm:petitions"] }) });
  if (await pageHas(title)) throw new Error("pétition encore visible après dépublish");
  console.log("✅ Masquée après dépublish");

  await api(`/api/admin/petitions/${petition.id}`, { method: "DELETE" });
  console.log("✅ Supprimée\n");
}

main().catch((e) => {
  console.error("❌", e.message);
  process.exit(1);
});
