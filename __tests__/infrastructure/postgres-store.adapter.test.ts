import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import type { Store } from "@/domain/entities/store";

const mockLoad = vi.fn();
const mockSave = vi.fn();
const mockGetCache = vi.fn();
const mockSetCache = vi.fn();

vi.mock("@/infrastructure/persistence/db-adapter", () => ({
  loadStoreFromPostgres: () => mockLoad(),
  saveStoreToPostgres: (store: Store) => mockSave(store),
  getPgStoreCache: () => mockGetCache(),
  setPgStoreCache: (store: Store) => mockSetCache(store),
  isPostgresEnabled: () => true,
}));

describe("postgresStoreAdapter", () => {
  const env = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...env, DATABASE_URL: "postgresql://test" };
    mockLoad.mockReset();
    mockSave.mockReset();
    mockGetCache.mockReset();
    mockSetCache.mockReset();
    mockGetCache.mockReturnValue(null);
  });

  afterEach(() => {
    process.env = env;
  });

  it("write mutates then saves to postgres", async () => {
    const seed = {
      _counters: { global: 1 },
      news: [],
      studies: [],
      campaigns: [],
      partners: [],
      testimonials: [],
      actions: [],
      memberships: [],
      help_requests: [],
      newsletter: [],
      contact_messages: [],
      press_releases: [],
      site_settings: {},
      users: [],
      family_links: [],
      donations: [],
      petitions: [],
      petition_signatures: [],
      help_request_updates: [],
      password_reset_tokens: [],
      live_events: [],
      live_chat_messages: [],
      live_polls: [],
      live_poll_votes: [],
      push_subscriptions: [],
    } as Store;

    mockLoad.mockResolvedValue(seed);
    mockSave.mockResolvedValue(undefined);

    const { postgresStoreAdapter } = await import(
      "@/infrastructure/persistence/postgres-store.adapter"
    );

    await postgresStoreAdapter.write((store) => {
      store.news.push({
        id: 2,
        title: "Test",
        slug: "test",
        excerpt: null,
        content: "c",
        category: "actualite",
        published: 1,
        created_at: new Date().toISOString(),
      });
    });

    expect(mockSave).toHaveBeenCalledTimes(1);
    expect(mockSave.mock.calls[0][0].news).toHaveLength(1);
    expect(mockSetCache).toHaveBeenCalled();
  });
});

describe("store.factory", () => {
  const env = process.env;

  afterEach(() => {
    process.env = env;
  });

  it("uses json adapter without DATABASE_URL", async () => {
    delete process.env.DATABASE_URL;
    vi.resetModules();
    const { getStorePort, resetStorePortForTests } = await import(
      "@/infrastructure/persistence/store.factory"
    );
    resetStorePortForTests();
    const port = getStorePort();
    const store = await port.read();
    expect(store.news.length).toBeGreaterThan(0);
  });

  it("uses postgres adapter with DATABASE_URL", async () => {
    process.env.DATABASE_URL = "postgresql://test";
    vi.resetModules();
    const { getStorePort, resetStorePortForTests } = await import(
      "@/infrastructure/persistence/store.factory"
    );
    resetStorePortForTests();
    mockLoad.mockResolvedValue(null);
    mockGetCache.mockReturnValue(null);
    const { loadSeedStore } = await import("@/infrastructure/persistence/store-seed");
    mockLoad.mockResolvedValue(loadSeedStore());

    const port = getStorePort();
    const { postgresStoreAdapter } = await import(
      "@/infrastructure/persistence/postgres-store.adapter"
    );
    expect(port).toBe(postgresStoreAdapter);
    const store = await port.read();
    expect(store).toBeDefined();
  });
});
