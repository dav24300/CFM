#!/usr/bin/env node
/** E7 — démarrer live admin → homepage + /live */
const BASE = process.env.CFM_E2E_BASE || "http://localhost:3000";
const PASSWORD = process.env.ADMIN_PASSWORD || "admin123";
const TAG = `v3-live-${Date.now()}`;

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
  if (!c) throw new Error("login failed");
  cookie = c.split(";")[0];
}

async function pageHas(path, text) {
  const res = await fetch(`${BASE}${path}`);
  const html = await res.text();
  return res.ok && html.includes(text);
}

async function main() {
  console.log(`\n📋 Test V3 E7 live — ${BASE}\n`);
  await login();

  const title = `Live ${TAG}`;
  const create = await api("/api/admin/live", {
    method: "POST",
    body: JSON.stringify({
      action: "create",
      title,
      description: "Test V3 mobilisation",
      chat_moderation: true,
    }),
  });
  if (!create.ok) throw new Error(`create ${create.status}`);
  const { event } = await create.json();
  console.log(`✅ Créé slug=${event.slug}`);

  const start = await api("/api/admin/live", {
    method: "POST",
    body: JSON.stringify({ action: "set_status", id: event.id, status: "live" }),
  });
  if (!start.ok) throw new Error(`start ${start.status}`);

  await api("/api/admin/preview", {
    method: "POST",
    body: JSON.stringify({ tags: ["cfm:live"] }),
  });

  const onLive = await pageHas("/live", title);
  const onHome = await pageHas("/", title);
  if (!onLive) throw new Error("live absent de /live");
  if (!onHome) throw new Error("live absent de la homepage");
  console.log("✅ Visible sur /live et homepage");

  await api("/api/admin/live", {
    method: "POST",
    body: JSON.stringify({ action: "set_status", id: event.id, status: "ended" }),
  });
  console.log("✅ Live terminé\n");
}

main().catch((e) => {
  console.error("❌", e.message);
  process.exit(1);
});
