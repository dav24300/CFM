#!/usr/bin/env node
/** Vérifie J1 — contenu V1 (5 types) admin → site */
const BASE = process.env.CFM_E2E_BASE || "http://localhost:3000";
const PASSWORD = process.env.ADMIN_PASSWORD || "admin123";
const TAG = `v1-${Date.now()}`;

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

async function preview(tags) {
  await api("/api/admin/preview", { method: "POST", body: JSON.stringify({ tags }) });
}

async function pageHas(path, text) {
  const res = await fetch(`${BASE}${path}`);
  const html = await res.text();
  return res.ok && html.includes(text);
}

async function testType({ label, postPath, payload, publicPath, tags }) {
  const title = `${label} ${TAG}`;
  const res = await api(postPath, { method: "POST", body: JSON.stringify({ ...payload, title }) });
  if (!res.ok) {
    log(false, label, `POST ${res.status}`);
    return;
  }
  await preview(tags);
  const ok = await pageHas(publicPath, title);
  log(ok, `${label} → ${publicPath}`, title);
}

async function main() {
  console.log(`\n📋 Vérification V1 contenu — ${BASE}\n`);
  await login();
  log(true, "Login admin");

  await testType({
    label: "Actualité",
    postPath: "/api/admin/news",
    payload: { content: "Corps test V1", slug: `news-${TAG}`, category: "actualite", excerpt: "Extrait" },
    publicPath: "/",
    tags: ["cfm:content", "cfm:news"],
  });
  await testType({
    label: "Étude",
    postPath: "/api/admin/studies",
    payload: { content: "Corps étude V1", slug: `study-${TAG}`, summary: "Résumé" },
    publicPath: "/plaidoyer",
    tags: ["cfm:content", "cfm:studies"],
  });
  await testType({
    label: "Campagne",
    postPath: "/api/admin/campaigns",
    payload: { content: "Description campagne V1", slug: `camp-${TAG}` },
    publicPath: "/plaidoyer",
    tags: ["cfm:content", "cfm:campaigns"],
  });
  await testType({
    label: "Presse",
    postPath: "/api/admin/press-releases",
    payload: { content: "Communiqué V1", slug: `press-${TAG}` },
    publicPath: "/presse",
    tags: ["cfm:content", "cfm:press"],
  });
  await testType({
    label: "Témoignage",
    postPath: "/api/admin/testimonials",
    payload: { author: "Testeur V1", content: `Témoignage ${TAG}`, role: "Famille" },
    publicPath: "/",
    tags: ["cfm:content", "cfm:testimonials"],
  });

  const ok = results.filter((r) => r.ok).length;
  console.log(`\n--- V1: ${ok}/${results.length} ---\n`);
  process.exit(ok === results.length ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
