import "server-only";
import fs from "fs";
import path from "path";
import type { PoolClient } from "pg";
import type { Store } from "@/domain/entities/store";
import { normalizePgRows } from "@/infrastructure/persistence/normalize-pg-row";

export function isNormalizedPgEnabled(): boolean {
  return Boolean(process.env.DATABASE_URL) && process.env.CFM_PG_NORMALIZED !== "false";
}

export async function applyFullSchema(client: PoolClient): Promise<void> {
  const schemaPath = path.join(process.cwd(), "scripts", "schema.sql");
  const sql = fs.readFileSync(schemaPath, "utf-8");
  await client.query(sql);
}

export async function hasNormalizedData(client: PoolClient): Promise<boolean> {
  const res = await client.query("SELECT 1 FROM store_meta WHERE id = 1 LIMIT 1");
  return (res.rowCount ?? 0) > 0;
}

const TRUNCATE_TABLES = [
  "events",
  "member_messages",
  "member_resources",
  "live_poll_votes",
  "live_polls",
  "live_chat_messages",
  "live_events",
  "push_subscriptions",
  "petition_signatures",
  "petitions",
  "help_request_updates",
  "password_reset_tokens",
  "family_links",
  "donations",
  "users",
  "help_requests",
  "contact_messages",
  "memberships",
  "newsletter",
  "news",
  "studies",
  "campaigns",
  "partners",
  "testimonials",
  "actions",
  "press_releases",
  "site_settings",
  "store_meta",
].join(", ");

export async function saveStoreToTables(client: PoolClient, store: Store): Promise<void> {
  await client.query(`TRUNCATE ${TRUNCATE_TABLES} RESTART IDENTITY CASCADE`);

  await client.query(
    `INSERT INTO store_meta (id, counters, updated_at) VALUES (1, $1::jsonb, NOW())`,
    [JSON.stringify(store._counters || { global: 100 })]
  );

  for (const n of store.news) {
    await client.query(
      `INSERT INTO news (id, title, slug, excerpt, content, category, cover_image, cover_image_alt, published, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [n.id, n.title, n.slug, n.excerpt, n.content, n.category, n.cover_image ?? null, n.cover_image_alt ?? null, n.published, n.created_at]
    );
  }

  for (const s of store.studies) {
    await client.query(
      `INSERT INTO studies (id, title, slug, summary, content, file_url, published, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [s.id, s.title, s.slug, s.summary, s.content, s.file_url, s.published, s.created_at]
    );
  }

  for (const c of store.campaigns) {
    await client.query(
      `INSERT INTO campaigns (id, title, slug, description, content, image_url, petition_slug, active, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [c.id, c.title, c.slug, c.description, c.content, c.image_url, c.petition_slug ?? null, c.active, c.created_at]
    );
  }

  for (const p of store.partners) {
    await client.query(
      `INSERT INTO partners (id, name, logo_url, website, description, sort_order) VALUES ($1,$2,$3,$4,$5,$6)`,
      [p.id, p.name, p.logo_url, p.website, p.description, p.sort_order]
    );
  }

  for (const t of store.testimonials) {
    await client.query(
      `INSERT INTO testimonials (id, author, role, content, photo, photo_alt, anonymous, published, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [t.id, t.author, t.role, t.content, t.photo ?? null, t.photo_alt ?? null, t.anonymous, t.published, t.created_at]
    );
  }

  for (const a of store.actions) {
    await client.query(
      `INSERT INTO actions (id, province, title, description, date, type, photo) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [a.id, a.province, a.title, a.description, a.date, a.type, a.photo ?? null]
    );
  }

  for (const pr of store.press_releases) {
    await client.query(
      `INSERT INTO press_releases (id, title, slug, content, file_url, published, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [pr.id, pr.title, pr.slug, pr.content, pr.file_url, pr.published, pr.created_at]
    );
  }

  for (const [key, value] of Object.entries(store.site_settings || {})) {
    await client.query(`INSERT INTO site_settings (key, value) VALUES ($1, $2)`, [key, value]);
  }

  for (const m of store.memberships) {
    const rec = m as Record<string, unknown>;
    await client.query(
      `INSERT INTO memberships (id, data, created_at) VALUES ($1, $2::jsonb, $3)`,
      [rec.id, JSON.stringify(m), (rec.created_at as string) || new Date().toISOString()]
    );
  }

  for (const h of store.help_requests) {
    const rec = h as Record<string, unknown>;
    await client.query(
      `INSERT INTO help_requests (id, status, data, created_at) VALUES ($1, $2, $3::jsonb, $4)`,
      [rec.id, (rec.status as string) || "new", JSON.stringify(h), (rec.created_at as string) || new Date().toISOString()]
    );
  }

  for (const n of store.newsletter) {
    await client.query(`INSERT INTO newsletter (id, email, created_at) VALUES ($1, $2, $3)`, [n.id, n.email, n.created_at]);
  }

  for (const c of store.contact_messages) {
    const rec = c as Record<string, unknown>;
    await client.query(
      `INSERT INTO contact_messages (id, data, created_at) VALUES ($1, $2::jsonb, $3)`,
      [rec.id, JSON.stringify(c), (rec.created_at as string) || new Date().toISOString()]
    );
  }

  for (const u of store.users || []) {
    await client.query(
      `INSERT INTO users (id, email, password_hash, first_name, last_name, phone, province, role, membership_type,
        military_link, parent_military_name, skills, status, verified_at, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)`,
      [u.id, u.email, u.password_hash, u.first_name, u.last_name, u.phone, u.province, u.role, u.membership_type,
        u.military_link, u.parent_military_name, u.skills, u.status, u.verified_at, u.created_at]
    );
  }

  for (const fl of store.family_links || []) {
    await client.query(
      `INSERT INTO family_links (id, parent_user_id, child_user_id, relationship, status, initiated_by, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [fl.id, fl.parent_user_id, fl.child_user_id, fl.relationship, fl.status, fl.initiated_by, fl.created_at]
    );
  }

  for (const d of store.donations || []) {
    await client.query(
      `INSERT INTO donations (id, user_id, amount, currency, provider, phone, transaction_id, status, donor_name, donor_email, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
      [d.id, d.user_id, d.amount, d.currency, d.provider, d.phone, d.transaction_id, d.status, d.donor_name, d.donor_email, d.created_at]
    );
  }

  for (const p of store.petitions || []) {
    await client.query(
      `INSERT INTO petitions (id, title, slug, description, content, goal, signatures_count, active, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [p.id, p.title, p.slug, p.description, p.content, p.goal, p.signatures_count, p.active, p.created_at]
    );
  }

  for (const s of store.petition_signatures || []) {
    await client.query(
      `INSERT INTO petition_signatures (id, petition_id, user_id, email, name, signed_at) VALUES ($1,$2,$3,$4,$5,$6)`,
      [s.id, s.petition_id, s.user_id, s.email, s.name, s.signed_at]
    );
  }

  for (const u of store.help_request_updates || []) {
    await client.query(
      `INSERT INTO help_request_updates (id, help_request_id, status, note, updated_by, created_at) VALUES ($1,$2,$3,$4,$5,$6)`,
      [u.id, u.help_request_id, u.status, u.note, u.updated_by, u.created_at]
    );
  }

  for (const t of store.password_reset_tokens || []) {
    await client.query(
      `INSERT INTO password_reset_tokens (id, user_id, token, expires_at, used, created_at) VALUES ($1,$2,$3,$4,$5,$6)`,
      [t.id, t.user_id, t.token, t.expires_at, t.used, t.created_at]
    );
  }

  for (const e of store.live_events || []) {
    await client.query(
      `INSERT INTO live_events (id, title, slug, description, status, youtube_id, stream_url, replay_url,
        chat_moderation, viewer_count, started_at, ended_at, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
      [e.id, e.title, e.slug, e.description, e.status, e.youtube_id, e.stream_url, e.replay_url,
        e.chat_moderation, e.viewer_count, e.started_at, e.ended_at, e.created_at]
    );
  }

  for (const m of store.live_chat_messages || []) {
    await client.query(
      `INSERT INTO live_chat_messages (id, live_event_id, user_id, author_name, content, status, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [m.id, m.live_event_id, m.user_id, m.author_name, m.content, m.status, m.created_at]
    );
  }

  for (const p of store.live_polls || []) {
    await client.query(
      `INSERT INTO live_polls (id, live_event_id, question, options, active, created_at) VALUES ($1,$2,$3,$4::jsonb,$5,$6)`,
      [p.id, p.live_event_id, p.question, JSON.stringify(p.options), p.active, p.created_at]
    );
  }

  for (const v of store.live_poll_votes || []) {
    await client.query(
      `INSERT INTO live_poll_votes (id, poll_id, option_id, voter_key, created_at) VALUES ($1,$2,$3,$4,$5)`,
      [v.id, v.poll_id, v.option_id, v.voter_key, v.created_at]
    );
  }

  for (const s of store.push_subscriptions || []) {
    await client.query(
      `INSERT INTO push_subscriptions (id, endpoint, p256dh, auth, topics, created_at) VALUES ($1,$2,$3,$4,$5,$6)`,
      [s.id, s.endpoint, s.p256dh, s.auth, s.topics || ["lives"], s.created_at]
    );
  }

  for (const ev of store.events || []) {
    await client.query(
      `INSERT INTO events (id, title, description, province, "date", "time", type, location, capacity, rsvp_user_ids, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb,$11)`,
      [ev.id, ev.title, ev.description, ev.province, ev.date, ev.time, ev.type, ev.location,
        ev.capacity ?? null, JSON.stringify(ev.rsvp_user_ids || []), ev.created_at]
    );
  }

  for (const m of store.member_messages || []) {
    await client.query(
      `INSERT INTO member_messages (id, user_id, direction, author_name, subject, body, "read", created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [m.id, m.user_id, m.direction, m.author_name, m.subject ?? null, m.body, m.read, m.created_at]
    );
  }

  for (const r of store.member_resources || []) {
    await client.query(
      `INSERT INTO member_resources (id, title, category, description, file_url, external_url, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [r.id, r.title, r.category, r.description, r.file_url ?? null, r.external_url ?? null, r.created_at]
    );
  }
}

export async function loadStoreFromTables(client: PoolClient): Promise<Store | null> {
  if (!(await hasNormalizedData(client))) return null;

  const meta = await client.query<{ counters: Store["_counters"] }>(
    "SELECT counters FROM store_meta WHERE id = 1"
  );
  const counters = meta.rows[0]?.counters || { global: 100 };

  const q = async <T extends import("pg").QueryResultRow>(sql: string) =>
    normalizePgRows((await client.query<T>(sql)).rows);

  const news = await q<Store["news"][0]>("SELECT * FROM news ORDER BY id");
  const studies = await q<Store["studies"][0]>("SELECT * FROM studies ORDER BY id");
  const campaigns = await q<Store["campaigns"][0]>("SELECT * FROM campaigns ORDER BY id");
  const partners = await q<Store["partners"][0]>("SELECT * FROM partners ORDER BY id");
  const testimonials = await q<Store["testimonials"][0]>("SELECT * FROM testimonials ORDER BY id");
  const actions = await q<Store["actions"][0]>("SELECT * FROM actions ORDER BY id");
  const press_releases = await q<Store["press_releases"][0]>("SELECT * FROM press_releases ORDER BY id");

  const settingsRows = await q<{ key: string; value: string }>("SELECT key, value FROM site_settings");
  const site_settings: Record<string, string> = {};
  for (const row of settingsRows) site_settings[row.key] = row.value;

  const memberships = (await q<{ data: Record<string, unknown> }>("SELECT data FROM memberships ORDER BY id")).map(
    (r) => r.data
  ) as Store["memberships"];

  const help_requests = (await q<{ data: Record<string, unknown> }>("SELECT data FROM help_requests ORDER BY id")).map(
    (r) => r.data
  ) as Store["help_requests"];

  const newsletter = await q<Store["newsletter"][0]>("SELECT id, email, created_at FROM newsletter ORDER BY id");

  const contact_messages = (
    await q<{ data: Record<string, unknown> }>("SELECT data FROM contact_messages ORDER BY id")
  ).map((r) => r.data) as Store["contact_messages"];

  const users = await q<Store["users"][0]>("SELECT * FROM users ORDER BY id");
  const family_links = await q<Store["family_links"][0]>("SELECT * FROM family_links ORDER BY id");
  const donations = await q<Store["donations"][0]>("SELECT * FROM donations ORDER BY id");
  const petitions = await q<Store["petitions"][0]>("SELECT * FROM petitions ORDER BY id");
  const petition_signatures = await q<Store["petition_signatures"][0]>(
    "SELECT * FROM petition_signatures ORDER BY id"
  );
  const help_request_updates = await q<Store["help_request_updates"][0]>(
    "SELECT * FROM help_request_updates ORDER BY id"
  );
  const password_reset_tokens = await q<Store["password_reset_tokens"][0]>(
    "SELECT * FROM password_reset_tokens ORDER BY id"
  );
  const live_events = await q<Store["live_events"][0]>("SELECT * FROM live_events ORDER BY id");
  const live_chat_messages = await q<Store["live_chat_messages"][0]>(
    "SELECT * FROM live_chat_messages ORDER BY id"
  );
  const live_polls = await q<Store["live_polls"][0]>("SELECT * FROM live_polls ORDER BY id");
  const live_poll_votes = await q<Store["live_poll_votes"][0]>("SELECT * FROM live_poll_votes ORDER BY id");
  const push_subscriptions = await q<Store["push_subscriptions"][0]>(
    "SELECT * FROM push_subscriptions ORDER BY id"
  );
  const events = await q<Store["events"][0]>("SELECT * FROM events ORDER BY id");
  const member_messages = await q<Store["member_messages"][0]>(
    "SELECT * FROM member_messages ORDER BY id"
  );
  const member_resources = await q<Store["member_resources"][0]>(
    "SELECT * FROM member_resources ORDER BY id"
  );

  return {
    _counters: counters,
    news,
    studies,
    campaigns,
    partners,
    testimonials,
    actions,
    memberships,
    help_requests,
    newsletter,
    contact_messages,
    press_releases,
    site_settings,
    users,
    family_links,
    donations,
    petitions,
    petition_signatures,
    help_request_updates,
    password_reset_tokens,
    live_events,
    live_chat_messages,
    live_polls,
    live_poll_votes,
    push_subscriptions,
    // Portail membre (Phase 3)
    events,
    member_messages,
    member_resources,
  };
}
