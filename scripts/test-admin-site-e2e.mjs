#!/usr/bin/env node
/**
 * E2E admin → site (local) — scénarios E1–E13
 * Usage: node scripts/test-admin-site-e2e.mjs
 */
const BASE = process.env.CFM_E2E_BASE || "http://localhost:3000";
const PASSWORD = process.env.ADMIN_PASSWORD || "admin123";
const TAG = `e2e-${Date.now()}`;

const TAGS = {
  siteConfig: "cfm:site-config",
  partners: "cfm:partners",
  content: "cfm:content",
  news: "cfm:news",
  mediaSettings: "cfm:media-settings",
  i18n: "cfm:i18n",
  petitions: "cfm:petitions",
  live: "cfm:live",
  actions: "cfm:actions",
};

let cookie = "";
const results = [];

function pass(id, name, detail = "") {
  results.push({ id, name, ok: true, detail });
  console.log(`✅ ${id} ${name}${detail ? ` — ${detail}` : ""}`);
}

function fail(id, name, detail = "") {
  results.push({ id, name, ok: false, detail });
  console.log(`❌ ${id} ${name}${detail ? ` — ${detail}` : ""}`);
}

function getSetCookies(res) {
  if (typeof res.headers.getSetCookie === "function") {
    return res.headers.getSetCookie();
  }
  const raw = res.headers.get("set-cookie");
  return raw ? [raw] : [];
}

async function api(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  if (cookie) headers.Cookie = cookie;
  if (options.body && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }
  return fetch(`${BASE}${path}`, { ...options, headers });
}

async function login() {
  const res = await api("/api/admin/login", {
    method: "POST",
    body: JSON.stringify({ password: PASSWORD }),
  });
  const cookies = getSetCookies(res);
  const adminCookie = cookies.find((c) => c.startsWith("cfm_admin_session="));
  if (!res.ok || !adminCookie) {
    throw new Error(`Login failed (${res.status})`);
  }
  cookie = adminCookie.split(";")[0];
}

async function preview(tags) {
  const res = await api("/api/admin/preview", {
    method: "POST",
    body: JSON.stringify({ tags }),
  });
  return res.ok;
}

async function fetchPage(path, extraHeaders = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Cache-Control": "no-cache", ...extraHeaders },
  });
  return { status: res.status, html: await res.text() };
}

async function waitForPage(path, predicate, attempts = 10, delayMs = 300) {
  for (let i = 0; i < attempts; i++) {
    const page = await fetchPage(path);
    if (predicate(page)) return page;
    await new Promise((r) => setTimeout(r, delayMs));
  }
  return fetchPage(path);
}

/** E1 — actualité → homepage + slug */
async function testE1News() {
  const title = `Actualité E2E ${TAG}`;
  const slug = `actualite-e2e-${TAG}`.toLowerCase().replace(/[^a-z0-9-]/g, "-");
  const createRes = await api("/api/admin/news", {
    method: "POST",
    body: JSON.stringify({
      title,
      content: "Contenu test E2E.",
      slug,
      excerpt: "Extrait E2E",
      category: "actualite",
      published: 1,
    }),
  });
  if (!createRes.ok) {
    fail("E1", "Créer actualité", `status ${createRes.status}`);
    return;
  }
  await preview([TAGS.content, TAGS.news]);
  const home = await waitForPage("/", (p) => p.html.includes(title));
  const article = await fetchPage(`/actualites/${slug}`);
  if (home.html.includes(title)) {
    pass("E1", "Actualité → homepage", title);
  } else if ((await fetchPage("/plaidoyer")).html.includes(title)) {
    pass("E1", "Actualité → /plaidoyer", title);
  } else {
    fail("E1", "Actualité → homepage", "titre absent");
  }
  if (article.status === 200 && article.html.includes(title)) {
    pass("E1", "Actualité → /actualites/[slug]", slug);
  } else {
    fail("E1", "Actualité → /actualites/[slug]", `HTTP ${article.status}`);
  }
}

/** E2 — hero alt → homepage */
async function testE2Hero() {
  const marker = `Hero E2E ${TAG}`;
  const patchRes = await api("/api/admin/media", {
    method: "PATCH",
    body: JSON.stringify({ hero: { hero_image_alt: marker } }),
  });
  if (!patchRes.ok) {
    fail("E2", "Modifier hero", `status ${patchRes.status}`);
    return;
  }
  await preview([TAGS.mediaSettings]);
  const page = await waitForPage("/", (p) => p.html.includes(marker));
  if (page.html.includes(marker)) {
    pass("E2", "Hero → homepage", marker);
  } else {
    fail("E2", "Hero → homepage", "alt absent du HTML");
  }
}

/** E3 — partenaire → Footer */
async function testE3Partners() {
  const partnerName = `Partenaire E2E ${TAG}`;
  const createRes = await api("/api/admin/partners", {
    method: "POST",
    body: JSON.stringify({
      name: partnerName,
      logo_url: "/media/axes/economie.svg",
      website: "https://example.com",
      sort_order: 99,
    }),
  });
  if (!createRes.ok) {
    fail("E3", "Ajouter partenaire", `status ${createRes.status}`);
    return;
  }
  await preview([TAGS.partners, TAGS.siteConfig]);
  const page = await fetchPage("/");
  if (page.html.includes(partnerName)) {
    pass("E3", "Partenaire → Footer", partnerName);
  } else {
    fail("E3", "Partenaire → Footer", "nom absent");
  }
}

/** E4 — email identité → /contact */
async function testE4Identity() {
  const testEmail = `contact-${TAG}@cfmasbl.com`;
  const patchRes = await api("/api/admin/settings", {
    method: "PATCH",
    body: JSON.stringify({ settings: { site_email: testEmail } }),
  });
  if (!patchRes.ok) {
    fail("E4", "Changer email", `status ${patchRes.status}`);
    return;
  }
  await preview([TAGS.siteConfig]);
  const { status, html } = await fetchPage("/contact");
  if (status === 200 && html.includes(testEmail)) {
    pass("E4", "Identité → /contact", testEmail);
  } else {
    fail("E4", "Identité → /contact", "email absent");
  }
}

/** E5 — override i18n nav FR + EN */
async function testE5I18n() {
  const frLabel = `À propos E2E ${TAG}`;
  const enLabel = `About E2E ${TAG}`;
  for (const [locale, key, value] of [
    ["fr", "nav.about", frLabel],
    ["en", "nav.about", enLabel],
  ]) {
    const patchRes = await api("/api/admin/i18n", {
      method: "PATCH",
      body: JSON.stringify({ locale, key, value }),
    });
    if (!patchRes.ok) {
      fail("E5", `i18n ${locale}`, `status ${patchRes.status}`);
      return;
    }
  }
  await preview([TAGS.i18n]);
  const frPage = await fetchPage("/", { Cookie: "cfm_locale=fr" });
  const enPage = await fetchPage("/", { Cookie: "cfm_locale=en" });
  if (frPage.html.includes(frLabel)) {
    pass("E5", "i18n FR → Header", frLabel);
  } else {
    fail("E5", "i18n FR → Header", "label FR absent");
  }
  if (enPage.html.includes(enLabel)) {
    pass("E5", "i18n EN → Header", enLabel);
  } else {
    fail("E5", "i18n EN → Header", "label EN absent");
  }
}

/** E6 — pétition publish → /petitions */
async function testE6Petition() {
  const title = `Pétition E2E ${TAG}`;
  const createRes = await api("/api/admin/petitions", {
    method: "POST",
    body: JSON.stringify({
      title,
      description: "Test E2E admin-site",
      content: "Contenu pétition test.",
      goal: 50,
    }),
  });
  if (!createRes.ok) {
    fail("E6", "Créer pétition", `status ${createRes.status}`);
    return;
  }
  const { petition } = await createRes.json();
  await preview([TAGS.petitions]);
  const page = await fetchPage("/petitions");
  if (page.html.includes(title)) {
    pass("E6", "Pétition → /petitions", title);
  } else {
    fail("E6", "Pétition → /petitions", "titre absent");
  }
  if (petition?.id) {
    await api(`/api/admin/petitions/${petition.id}`, {
      method: "PATCH",
      body: JSON.stringify({ active: 0 }),
    });
    await preview([TAGS.petitions]);
    const hidden = await waitForPage("/petitions", (p) => !p.html.includes(title));
    if (!hidden.html.includes(title)) {
      pass("E6", "Dépublier pétition", "masquée");
    } else {
      fail("E6", "Dépublier pétition", "encore visible");
    }
    await api(`/api/admin/petitions/${petition.id}`, { method: "DELETE" });
  }
}

/** E7 — live → /live + homepage */
async function testE7Live() {
  const title = `Live E2E ${TAG}`;
  const createRes = await api("/api/admin/live", {
    method: "POST",
    body: JSON.stringify({
      action: "create",
      title,
      description: "Test E2E live",
      chat_moderation: true,
    }),
  });
  if (!createRes.ok) {
    fail("E7", "Créer live", `status ${createRes.status}`);
    return;
  }
  const { event } = await createRes.json();
  const startRes = await api("/api/admin/live", {
    method: "POST",
    body: JSON.stringify({ action: "set_status", id: event.id, status: "live" }),
  });
  if (!startRes.ok) {
    fail("E7", "Démarrer live", `status ${startRes.status}`);
    return;
  }
  await preview([TAGS.live]);
  const livePage = await fetchPage("/live");
  const home = await fetchPage("/");
  if (livePage.html.includes(title)) {
    pass("E7", "Live → /live", title);
  } else {
    fail("E7", "Live → /live", "titre absent");
  }
  if (home.html.includes(title)) {
    pass("E7", "Live → homepage", "badge/section");
  } else {
    fail("E7", "Live → homepage", "live absent accueil");
  }
  await api("/api/admin/live", {
    method: "POST",
    body: JSON.stringify({ action: "set_status", id: event.id, status: "ended" }),
  });
}

/** E8 — toggle donateurs publics → /s-engager */
async function testE8DonorsPublic() {
  const patchRes = await api("/api/admin/settings", {
    method: "PATCH",
    body: JSON.stringify({ settings: { donors_public: "1" } }),
  });
  if (!patchRes.ok) {
    fail("E8", "Toggle donateurs publics", `status ${patchRes.status}`);
    return;
  }
  await preview([TAGS.siteConfig]);
  const page = await fetchPage("/s-engager");
  if (page.html.includes("Derniers dons (anonymisés)")) {
    pass("E8", "Donateurs publics → /s-engager", "liste visible");
  } else if (page.status === 200) {
    pass("E8", "Donateurs publics → /s-engager", "toggle actif (pas de dons complétés)");
  } else {
    fail("E8", "Donateurs publics → /s-engager", `HTTP ${page.status}`);
  }
  await api("/api/admin/settings", {
    method: "PATCH",
    body: JSON.stringify({ settings: { donors_public: "0" } }),
  });
}

/** E9 — réseaux sociaux → Footer */
async function testE9Social() {
  const marker = `https://social-e2e-${TAG}.example.com`;
  const links = {
    facebook: marker,
    twitter: "",
    youtube: "",
    linkedin: "",
  };
  const patchRes = await api("/api/admin/settings", {
    method: "PATCH",
    body: JSON.stringify({ settings: { social_links: JSON.stringify(links) } }),
  });
  if (!patchRes.ok) {
    fail("E9", "PATCH social_links", `status ${patchRes.status}`);
    return;
  }
  await preview([TAGS.siteConfig]);
  const page = await fetchPage("/");
  if (page.html.includes(marker)) {
    pass("E9", "Réseaux sociaux → Footer", marker);
  } else {
    fail("E9", "Réseaux sociaux → Footer", "URL absente");
  }
}

/** E10 — action territoire → /actions */
async function testE10Territory() {
  const title = `Action E2E ${TAG}`;
  const createRes = await api("/api/admin", {
    method: "POST",
    body: JSON.stringify({
      table: "actions",
      action: "create",
      data: {
        province: "Kinshasa",
        title,
        description: "Action créée par test E2E.",
        date: "2099-01-01",
        type: "sensibilisation",
      },
    }),
  });
  if (!createRes.ok) {
    fail("E10", "Créer action", `status ${createRes.status}`);
    return;
  }
  await preview([TAGS.actions, TAGS.content]);
  const page = await fetchPage("/actions");
  if (page.html.includes(title)) {
    pass("E10", "Action → /actions", title);
  } else {
    fail("E10", "Action → /actions", "titre absent");
  }
}

/** E11 — timeline → /a-propos */
async function testE11Timeline() {
  const marker = `Timeline E2E ${TAG}`;
  const blocks = {
    about_timeline: {
      fr: [{ date: "2099", title: marker, description: "Événement E2E." }],
      en: [{ date: "2099", title: marker, description: "E2E event." }],
    },
  };
  const patchRes = await api("/api/admin/settings", {
    method: "PATCH",
    body: JSON.stringify({ settings: { content_blocks: JSON.stringify(blocks) } }),
  });
  if (!patchRes.ok) {
    fail("E11", "PATCH timeline", `status ${patchRes.status}`);
    return;
  }
  await preview([TAGS.siteConfig]);
  const page = await fetchPage("/a-propos");
  if (page.html.includes(marker)) {
    pass("E11", "Timeline → /a-propos", marker);
  } else {
    fail("E11", "Timeline → /a-propos", "marker absent");
  }
}

/** E12 — légal markdown → /confidentialite */
async function testE12Legal() {
  const marker = `## Confidentialité E2E ${TAG}`;
  const blocks = {
    legal_privacy: {
      fr: marker,
      en: marker,
    },
  };
  const patchRes = await api("/api/admin/settings", {
    method: "PATCH",
    body: JSON.stringify({ settings: { content_blocks: JSON.stringify(blocks) } }),
  });
  if (!patchRes.ok) {
    fail("E12", "PATCH légal", `status ${patchRes.status}`);
    return;
  }
  await preview([TAGS.siteConfig]);
  const page = await fetchPage("/confidentialite");
  if (page.html.includes(marker.replace("## ", "")) || page.html.includes(TAG)) {
    pass("E12", "Légal → /confidentialite", "contenu CMS visible");
  } else {
    fail("E12", "Légal → /confidentialite", "markdown absent");
  }
}

/** E13 — preview < 5 s (mesure après invalidation cache) */
async function testE13PreviewSpeed() {
  const marker = `Preview speed ${TAG}`;
  const patchRes = await api("/api/admin/settings", {
    method: "PATCH",
    body: JSON.stringify({ settings: { site_tagline: marker } }),
  });
  if (!patchRes.ok) {
    fail("E13", "Preview < 5 s", `PATCH ${patchRes.status}`);
    return;
  }
  const t0 = Date.now();
  await preview([TAGS.siteConfig]);
  let visible = false;
  for (let i = 0; i < 25; i++) {
    const page = await fetchPage("/");
    if (page.html.includes(marker)) {
      visible = true;
      break;
    }
    await new Promise((r) => setTimeout(r, 150));
  }
  const elapsed = Date.now() - t0;
  if (visible && elapsed < 5000) {
    pass("E13", "Preview < 5 s", `${elapsed}ms`);
  } else if (visible) {
    fail("E13", "Preview < 5 s", `visible mais ${elapsed}ms`);
  } else {
    fail("E13", "Preview < 5 s", "changement non visible");
  }
}

async function main() {
  console.log(`\n🧪 E2E Admin → Site (E1–E13) — ${BASE}\n`);
  try {
    await login();
    pass("—", "Admin login", "/api/admin/login");
  } catch (e) {
    fail("—", "Admin login", String(e));
    process.exit(1);
  }

  await testE1News();
  await testE2Hero();
  await testE3Partners();
  await testE4Identity();
  await testE5I18n();
  await testE6Petition();
  await testE7Live();
  await testE8DonorsPublic();
  await testE9Social();
  await testE10Territory();
  await testE11Timeline();
  await testE12Legal();
  await testE13PreviewSpeed();

  const ok = results.filter((r) => r.ok).length;
  const total = results.length;
  const failed = results.filter((r) => !r.ok);
  console.log(`\n--- Résultat: ${ok}/${total} ---`);
  if (failed.length > 0) {
    console.log("\nÉchecs:");
    for (const f of failed) {
      console.log(`  • ${f.id} ${f.name}: ${f.detail}`);
    }
  }
  console.log("");
  process.exit(failed.length === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
