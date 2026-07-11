import "server-only";
import fs from "fs";
import path from "path";
import type { PoolClient } from "pg";
import type { Store } from "@/domain/entities/store";
import { normalizePgRows } from "@/infrastructure/persistence/normalize-pg-row";
import { isTableMigrated } from "@/infrastructure/persistence/sql/migrated-tables";

export async function applyFullSchema(client: PoolClient): Promise<void> {
  const schemaPath = path.join(process.cwd(), "scripts", "schema.sql");
  const sql = fs.readFileSync(schemaPath, "utf-8");
  await client.query(sql);
}

export async function hasNormalizedData(client: PoolClient): Promise<boolean> {
  const res = await client.query("SELECT 1 FROM store_meta WHERE id = 1 LIMIT 1");
  return (res.rowCount ?? 0) > 0;
}

/**
 * Sync Store ↔ tables normalisées — MODULE SCRIPTS UNIQUEMENT depuis C13.
 * Au runtime, tous les agrégats passent par repositories/sql/* ; ce module
 * ne sert plus qu'aux scripts de provisionnement/sauvegarde :
 * - migrate-json-to-pg.mjs : saveStoreToTables({includeMigrated: true})
 * - hydrate-from-postgres.mjs : loadStoreFromTables
 *
 * Sync différentiel (remplace l'ancien TRUNCATE 28 tables) :
 * prune enfants→parents PUIS upsert parents→enfants — le prune préalable
 * évite les violations d'index uniques transitoires.
 */

type Row = Record<string, unknown>;

type TableSpec = {
  table: string;
  pk: string;
  pkType: "int" | "text";
  cols: string[];
  rows: (store: Store) => Row[];
};

const nowIso = () => new Date().toISOString();

/** Ordre parents → enfants (FK) ; le prune parcourt cette liste à l'envers. */
const TABLE_SPECS: TableSpec[] = [
  {
    table: "news",
    pk: "id",
    pkType: "int",
    cols: ["id", "title", "slug", "excerpt", "content", "category", "cover_image", "cover_image_alt", "published", "created_at"],
    rows: (s) => s.news as unknown as Row[],
  },
  {
    table: "studies",
    pk: "id",
    pkType: "int",
    cols: ["id", "title", "slug", "summary", "content", "file_url", "published", "created_at"],
    rows: (s) => s.studies as unknown as Row[],
  },
  {
    table: "campaigns",
    pk: "id",
    pkType: "int",
    cols: ["id", "title", "slug", "description", "content", "image_url", "petition_slug", "active", "created_at"],
    rows: (s) => s.campaigns as unknown as Row[],
  },
  {
    table: "partners",
    pk: "id",
    pkType: "int",
    cols: ["id", "name", "logo_url", "website", "description", "sort_order"],
    rows: (s) => s.partners as unknown as Row[],
  },
  {
    table: "testimonials",
    pk: "id",
    pkType: "int",
    cols: ["id", "author", "role", "content", "photo", "photo_alt", "anonymous", "published", "created_at"],
    rows: (s) => s.testimonials as unknown as Row[],
  },
  {
    table: "actions",
    pk: "id",
    pkType: "int",
    cols: ["id", "province", "title", "description", "date", "type", "photo"],
    rows: (s) => s.actions as unknown as Row[],
  },
  {
    table: "press_releases",
    pk: "id",
    pkType: "int",
    cols: ["id", "title", "slug", "content", "file_url", "published", "created_at"],
    rows: (s) => s.press_releases as unknown as Row[],
  },
  {
    table: "site_settings",
    pk: "key",
    pkType: "text",
    cols: ["key", "value"],
    rows: (s) =>
      Object.entries(s.site_settings || {}).map(([key, value]) => ({ key, value })),
  },
  {
    table: "memberships",
    pk: "id",
    pkType: "int",
    cols: ["id", "data", "created_at"],
    rows: (s) =>
      s.memberships.map((m) => {
        const rec = m as Row;
        return { id: rec.id, data: JSON.stringify(m), created_at: rec.created_at || nowIso() };
      }),
  },
  {
    table: "help_requests",
    pk: "id",
    pkType: "int",
    cols: ["id", "status", "data", "created_at"],
    rows: (s) =>
      s.help_requests.map((h) => {
        const rec = h as Row;
        return {
          id: rec.id,
          status: rec.status || "new",
          data: JSON.stringify(h),
          created_at: rec.created_at || nowIso(),
        };
      }),
  },
  {
    table: "newsletter",
    pk: "id",
    pkType: "int",
    cols: ["id", "email", "created_at"],
    rows: (s) => s.newsletter as unknown as Row[],
  },
  {
    table: "contact_messages",
    pk: "id",
    pkType: "int",
    cols: ["id", "data", "created_at"],
    rows: (s) =>
      s.contact_messages.map((c) => {
        const rec = c as Row;
        return { id: rec.id, data: JSON.stringify(c), created_at: rec.created_at || nowIso() };
      }),
  },
  {
    table: "users",
    pk: "id",
    pkType: "int",
    cols: ["id", "email", "password_hash", "first_name", "last_name", "phone", "province", "role", "membership_type", "military_link", "parent_military_name", "skills", "status", "verified_at", "created_at"],
    rows: (s) => (s.users || []) as unknown as Row[],
  },
  {
    table: "family_links",
    pk: "id",
    pkType: "int",
    cols: ["id", "parent_user_id", "child_user_id", "relationship", "status", "initiated_by", "created_at"],
    rows: (s) => (s.family_links || []) as unknown as Row[],
  },
  {
    table: "donations",
    pk: "id",
    pkType: "int",
    cols: ["id", "user_id", "amount", "currency", "provider", "phone", "transaction_id", "status", "donor_name", "donor_email", "created_at"],
    rows: (s) => (s.donations || []) as unknown as Row[],
  },
  {
    table: "petitions",
    pk: "id",
    pkType: "int",
    cols: ["id", "title", "slug", "description", "content", "goal", "signatures_count", "active", "created_at"],
    rows: (s) => (s.petitions || []) as unknown as Row[],
  },
  {
    table: "petition_signatures",
    pk: "id",
    pkType: "int",
    cols: ["id", "petition_id", "user_id", "email", "name", "signed_at"],
    rows: (s) => (s.petition_signatures || []) as unknown as Row[],
  },
  {
    table: "help_request_updates",
    pk: "id",
    pkType: "int",
    cols: ["id", "help_request_id", "status", "note", "updated_by", "created_at"],
    rows: (s) => (s.help_request_updates || []) as unknown as Row[],
  },
  {
    table: "password_reset_tokens",
    pk: "id",
    pkType: "int",
    cols: ["id", "user_id", "token", "expires_at", "used", "created_at"],
    rows: (s) => (s.password_reset_tokens || []) as unknown as Row[],
  },
  {
    table: "live_events",
    pk: "id",
    pkType: "int",
    cols: ["id", "title", "slug", "description", "status", "youtube_id", "stream_url", "replay_url", "thumbnail", "thumbnail_alt", "chat_moderation", "viewer_count", "started_at", "ended_at", "created_at"],
    rows: (s) => (s.live_events || []) as unknown as Row[],
  },
  {
    table: "live_chat_messages",
    pk: "id",
    pkType: "int",
    cols: ["id", "live_event_id", "user_id", "author_name", "content", "status", "created_at"],
    rows: (s) => (s.live_chat_messages || []) as unknown as Row[],
  },
  {
    table: "live_polls",
    pk: "id",
    pkType: "int",
    cols: ["id", "live_event_id", "question", "options", "active", "created_at"],
    rows: (s) =>
      (s.live_polls || []).map((p) => ({
        id: p.id,
        live_event_id: p.live_event_id,
        question: p.question,
        options: JSON.stringify(p.options),
        active: p.active,
        created_at: p.created_at,
      })),
  },
  {
    table: "live_poll_votes",
    pk: "id",
    pkType: "int",
    cols: ["id", "poll_id", "option_id", "voter_key", "created_at"],
    rows: (s) => (s.live_poll_votes || []) as unknown as Row[],
  },
  {
    table: "push_subscriptions",
    pk: "id",
    pkType: "int",
    cols: ["id", "endpoint", "p256dh", "auth", "topics", "created_at"],
    rows: (s) =>
      (s.push_subscriptions || []).map((sub) => ({
        id: sub.id,
        endpoint: sub.endpoint,
        p256dh: sub.p256dh,
        auth: sub.auth,
        topics: sub.topics || ["lives"],
        created_at: sub.created_at,
      })),
  },
  {
    table: "events",
    pk: "id",
    pkType: "int",
    cols: ["id", "title", "description", "province", "date", "time", "type", "location", "capacity", "rsvp_user_ids", "created_at"],
    rows: (s) =>
      (s.events || []).map((ev) => ({
        id: ev.id,
        title: ev.title,
        description: ev.description,
        province: ev.province,
        date: ev.date,
        time: ev.time,
        type: ev.type,
        location: ev.location,
        capacity: ev.capacity ?? null,
        rsvp_user_ids: JSON.stringify(ev.rsvp_user_ids || []),
        created_at: ev.created_at,
      })),
  },
  {
    table: "member_messages",
    pk: "id",
    pkType: "int",
    cols: ["id", "user_id", "direction", "author_name", "subject", "body", "read", "created_at"],
    rows: (s) => (s.member_messages || []) as unknown as Row[],
  },
  {
    table: "member_resources",
    pk: "id",
    pkType: "int",
    cols: ["id", "title", "category", "description", "file_url", "external_url", "created_at"],
    rows: (s) => (s.member_resources || []) as unknown as Row[],
  },
];

async function pruneTable(client: PoolClient, spec: TableSpec, store: Store): Promise<void> {
  const keep = spec.rows(store).map((r) => r[spec.pk]);
  const cast = spec.pkType === "int" ? "int[]" : "text[]";
  await client.query(
    `DELETE FROM "${spec.table}" WHERE NOT ("${spec.pk}" = ANY($1::${cast}))`,
    [keep]
  );
}

async function upsertRow(client: PoolClient, spec: TableSpec, row: Row): Promise<void> {
  const colsSql = spec.cols.map((c) => `"${c}"`).join(", ");
  const placeholders = spec.cols.map((_, i) => `$${i + 1}`).join(", ");
  const updates = spec.cols
    .filter((c) => c !== spec.pk)
    .map((c) => `"${c}" = EXCLUDED."${c}"`)
    .join(", ");
  await client.query(
    `INSERT INTO "${spec.table}" (${colsSql}) VALUES (${placeholders})
     ON CONFLICT ("${spec.pk}") DO UPDATE SET ${updates}`,
    spec.cols.map((c) => (row[c] === undefined ? null : row[c]))
  );
}

export async function saveStoreToTables(
  client: PoolClient,
  store: Store,
  options: {
    /**
     * Scripts de provisionnement UNIQUEMENT (migrate-json-to-pg) : écrit aussi
     * les tables migrées en SQL ciblé. JAMAIS au runtime — un snapshot Store
     * périmé écraserait les écritures SQL concurrentes.
     */
    includeMigrated?: boolean;
  } = {}
): Promise<void> {
  const skip = (table: string) => !options.includeMigrated && isTableMigrated(table);

  // 1. Prune des lignes absentes du store (enfants d'abord — les FK ON DELETE
  //    CASCADE ne touchent que des lignes elles-mêmes absentes du store).
  for (let i = TABLE_SPECS.length - 1; i >= 0; i--) {
    const spec = TABLE_SPECS[i];
    if (skip(spec.table)) continue;
    await pruneTable(client, spec, store);
  }

  // 2. Upsert (parents d'abord pour satisfaire les FK).
  for (const spec of TABLE_SPECS) {
    if (skip(spec.table)) continue;
    for (const row of spec.rows(store)) {
      await upsertRow(client, spec, row);
    }
  }

  // 3. store_meta : compteurs + updated_at. seed_version n'est jamais écrasé
  //    ici (il n'est posé que par le seeding one-shot, cf. db-adapter).
  await client.query(
    `INSERT INTO store_meta (id, counters, seed_version, updated_at)
     VALUES (1, $1::jsonb, $2, NOW())
     ON CONFLICT (id) DO UPDATE SET counters = EXCLUDED.counters, updated_at = NOW()`,
    [JSON.stringify(store._counters || { global: 100 }), store._seed_version ?? 0]
  );
}

export async function loadStoreFromTables(client: PoolClient): Promise<Store | null> {
  if (!(await hasNormalizedData(client))) return null;

  const meta = await client.query<{ counters: Store["_counters"]; seed_version: number | null }>(
    "SELECT counters, seed_version FROM store_meta WHERE id = 1"
  );
  const counters = meta.rows[0]?.counters || { global: 100 };
  const seedVersion = meta.rows[0]?.seed_version ?? 0;

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
    _seed_version: seedVersion,
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
