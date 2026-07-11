/**
 * Intégration PG — sync différentiel (C1, refactor persistance).
 * Requiert TEST_DATABASE_URL (base dédiée, ex. postgresql://cfm:cfm_dev_password@localhost:5433/cfm_test).
 * Skippé sans la variable ; le gate des commits P1 l'exige.
 * ATTENTION : la base est entièrement réinitialisée (DROP SCHEMA public CASCADE).
 */
import { describe, expect, it, beforeAll, afterAll } from "vitest";
import type { Store } from "@/domain/entities/store";

const TEST_URL = process.env.TEST_DATABASE_URL;

function fixtureStore(): Store {
  const t = "2026-01-01T00:00:00.000Z";
  return {
    _counters: { global: 200 },
    _seed_version: 4,
    news: [
      { id: 1, title: "N1", slug: "n1", excerpt: null, content: "c", category: "actualite", published: 1, created_at: t },
    ],
    studies: [],
    campaigns: [],
    partners: [{ id: 2, name: "P", logo_url: null, website: null, description: null, sort_order: 1 }],
    testimonials: [],
    actions: [{ id: 3, province: "Kinshasa", title: "A", description: null, date: "2025-01-15", type: "evenement" }],
    memberships: [{ id: 4, type: "membre", first_name: "Jean", last_name: "K", phone: "1", status: "pending", created_at: t }],
    help_requests: [{ id: 5, status: "new", category: "aide", created_at: t }],
    newsletter: [{ id: 6, email: "a@ex.com", created_at: t }],
    contact_messages: [{ id: 7, name: "X", email: "x@ex.com", message: "m", status: "new", created_at: t }],
    press_releases: [],
    site_settings: { social_links: "{}", tagline: "test" },
    users: [
      {
        id: 20, email: "u@ex.com", password_hash: "h", first_name: "U", last_name: "V",
        phone: null, province: null, role: "member", membership_type: "membre",
        military_link: null, parent_military_name: null, skills: null,
        status: "active", verified_at: null, created_at: t,
      } as unknown as Store["users"][0],
    ],
    family_links: [],
    donations: [
      {
        id: 26, user_id: 20, amount: 25, currency: "USD", provider: "orange", phone: null,
        transaction_id: null, status: "pending", donor_name: "U", donor_email: "u@ex.com", created_at: t,
      } as unknown as Store["donations"][0],
    ],
    petitions: [
      { id: 21, title: "Pét", slug: "pet-1", description: "d", content: null, goal: 100, signatures_count: 1, active: 1, created_at: t },
    ],
    petition_signatures: [
      { id: 22, petition_id: 21, user_id: null, email: "sig@ex.com", name: "S", signed_at: t },
    ],
    help_request_updates: [
      { id: 30, help_request_id: 5, status: "new", note: "n", updated_by: "admin", created_at: t } as Store["help_request_updates"][0],
    ],
    password_reset_tokens: [],
    live_events: [
      {
        id: 23, title: "Live", slug: "live-1", description: "desc", status: "replay",
        youtube_id: null, stream_url: null, replay_url: null,
        thumbnail: "/uploads/t.jpg", thumbnail_alt: "alt",
        chat_moderation: 1, viewer_count: 0, started_at: t, ended_at: t, created_at: t,
      },
    ],
    live_chat_messages: [],
    live_polls: [
      { id: 24, live_event_id: 23, question: "Q ?", options: [{ id: "a", text: "A", votes: 0 }], active: 1, created_at: t },
    ],
    live_poll_votes: [
      { id: 25, poll_id: 24, option_id: "a", voter_key: "vk1", created_at: t },
    ],
    push_subscriptions: [
      { id: 32, endpoint: "https://push/ep1", p256dh: "k", auth: "a", topics: ["lives"], created_at: t } as Store["push_subscriptions"][0],
    ],
    events: [
      { id: 33, title: "Ev", description: "d", province: "Kinshasa", date: "2026-08-01", time: "09:00", type: "atelier", location: "Kin", capacity: 10, rsvp_user_ids: [20], created_at: t },
    ],
    member_messages: [
      { id: 34, user_id: 20, direction: "in", author_name: "U", subject: null, body: "b", read: 0, created_at: t } as Store["member_messages"][0],
    ],
    member_resources: [],
  };
}

describe.skipIf(!TEST_URL)("pg-sync différentiel (intégration PG)", () => {
  /* eslint-disable @typescript-eslint/no-explicit-any */
  let db: typeof import("@/infrastructure/persistence/db-adapter");
  let sqlClient: typeof import("@/infrastructure/persistence/sql/sql-client");
  let migrated: typeof import("@/infrastructure/persistence/sql/migrated-tables");

  beforeAll(async () => {
    process.env.DATABASE_URL = TEST_URL;
    process.env.CFM_PG_NORMALIZED = "true";

    // Réinitialisation complète de la base de test.
    const pg = await import("pg");
    const admin = new pg.Pool({ connectionString: TEST_URL, connectionTimeoutMillis: 5000 });
    await admin.query("DROP SCHEMA public CASCADE; CREATE SCHEMA public;");
    await admin.end();

    db = await import("@/infrastructure/persistence/db-adapter");
    sqlClient = await import("@/infrastructure/persistence/sql/sql-client");
    migrated = await import("@/infrastructure/persistence/sql/migrated-tables");
    await sqlClient.ensureSchemaOnce();
  });

  afterAll(async () => {
    migrated.__setMigratedTablesForTests([]);
    await sqlClient.closePoolForTests();
  });

  it("save → load : iso-comportement (deep-equal des collections)", async () => {
    const fixture = fixtureStore();
    await db.saveStoreToPostgres(fixture);
    const loaded = await db.loadStoreFromPostgres();
    expect(loaded).not.toBeNull();
    const l = loaded as Store;

    expect(l.news).toEqual(fixture.news);
    expect(l.partners).toEqual(fixture.partners);
    expect(l.actions).toEqual(fixture.actions);
    expect(l.memberships).toEqual(fixture.memberships);
    expect(l.help_requests).toEqual(fixture.help_requests);
    expect(l.newsletter).toEqual(fixture.newsletter);
    expect(l.contact_messages).toEqual(fixture.contact_messages);
    expect(l.site_settings).toEqual(fixture.site_settings);
    expect(l.users).toEqual(fixture.users);
    expect(l.petitions).toEqual(fixture.petitions);
    expect(l.petition_signatures).toEqual(fixture.petition_signatures);
    expect(l.help_request_updates).toEqual(fixture.help_request_updates);
    expect(l.live_events).toEqual(fixture.live_events); // thumbnail conservé
    expect(l.live_polls).toEqual(fixture.live_polls);
    expect(l.live_poll_votes).toEqual(fixture.live_poll_votes);
    expect(l.push_subscriptions).toEqual(fixture.push_subscriptions);
    expect(l.events).toEqual(fixture.events);
    expect(l.member_messages).toEqual(fixture.member_messages);
    expect(l._counters).toEqual(fixture._counters);
    expect(l._seed_version).toBe(4);
    // DECIMAL revient en chaîne (comportement pg historique, iso)
    expect(Number((l.donations[0] as { amount: unknown }).amount)).toBe(25);
  });

  it("prune : une ligne supprimée du store disparaît de la table", async () => {
    const fixture = fixtureStore();
    fixture.newsletter = []; // désinscription
    await db.saveStoreToPostgres(fixture);
    const res = await sqlClient.query("SELECT COUNT(*)::int AS n FROM newsletter");
    expect(res.rows[0].n).toBe(0);
  });

  it("re-signature même email sous un nouvel id : le save passe (prune avant upsert)", async () => {
    const fixture = fixtureStore();
    fixture.petition_signatures = [
      { id: 99, petition_id: 21, user_id: null, email: "sig@ex.com", name: "S2", signed_at: "2026-01-02T00:00:00.000Z" },
    ];
    await db.saveStoreToPostgres(fixture);
    const res = await sqlClient.query(
      "SELECT id, name FROM petition_signatures WHERE petition_id = 21"
    );
    expect(res.rows).toEqual([{ id: 99, name: "S2" }]);
  });

  it("table migrée : le sync Store ne la touche plus (ni prune ni upsert)", async () => {
    const fixture = fixtureStore();
    fixture.petition_signatures = [
      { id: 99, petition_id: 21, user_id: null, email: "sig@ex.com", name: "S2", signed_at: "2026-01-02T00:00:00.000Z" },
    ];
    await db.saveStoreToPostgres(fixture);

    migrated.__setMigratedTablesForTests(["petitions", "petition_signatures"]);
    const wiped = fixtureStore();
    wiped.petitions = [];
    wiped.petition_signatures = [];
    await db.saveStoreToPostgres(wiped);
    migrated.__setMigratedTablesForTests([]);

    const pets = await sqlClient.query("SELECT COUNT(*)::int AS n FROM petitions");
    const sigs = await sqlClient.query("SELECT COUNT(*)::int AS n FROM petition_signatures");
    expect(pets.rows[0].n).toBe(1); // intact malgré le store vidé
    expect(sigs.rows[0].n).toBe(1);
  });

  it("séquences : INSERT sans id utilise nextval au-dessus du compteur global", async () => {
    const res = await sqlClient.query<{ id: number }>(
      "INSERT INTO newsletter (email, created_at) VALUES ('seq@ex.com', NOW()) RETURNING id"
    );
    // seuil = GREATEST(max(id), counters.global=200, 100) → id > 200
    expect(res.rows[0].id).toBeGreaterThan(200);
    await sqlClient.query("DELETE FROM newsletter WHERE email = 'seq@ex.com'");
  });

  it("claimSeedVersion : accordé une seule fois", async () => {
    await sqlClient.query("UPDATE store_meta SET seed_version = 0 WHERE id = 1");
    expect(await db.claimSeedVersion()).toBe(true);
    expect(await db.claimSeedVersion()).toBe(false);
  });
});
