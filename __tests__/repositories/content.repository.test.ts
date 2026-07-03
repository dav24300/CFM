import { beforeEach, describe, expect, it, vi } from "vitest";

let mockStore: any;

vi.mock("@/infrastructure/persistence/store-access", () => ({
  getStore: vi.fn(() => mockStore),
  updateStore: vi.fn((mutator: (store: any) => void) => mutator(mockStore)),
  nextId: vi.fn(() => 999),
}));

vi.mock("@/infrastructure/persistence/store.impl", () => ({
  slugify: vi.fn((value: string) =>
    value
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, "-")
      .replace(/[^\w-]/g, "")
  ),
}));

vi.mock("@/infrastructure/encryption/aes.adapter", () => ({
  decryptHelpRequest: vi.fn((payload: Record<string, unknown>) => payload),
}));

import {
  addContactMessage,
  addMembership,
  addHelpRequest,
  addNewsletter,
  adminCreate,
  adminDelete,
  adminUpdateStatus,
  getAdminData,
  getAdminStats,
  getPublishedNews,
} from "@/infrastructure/repositories/content.repository";

describe("content.repository", () => {
  beforeEach(() => {
    mockStore = {
      news: [
        { id: 1, title: "Old", published: 1, created_at: "2026-01-01T00:00:00.000Z" },
        { id: 2, title: "Draft", published: 0, created_at: "2026-03-01T00:00:00.000Z" },
        { id: 3, title: "Latest", published: 1, created_at: "2026-04-01T00:00:00.000Z" },
      ],
      studies: [],
      campaigns: [],
      actions: [{ id: 99, date: "2026-02-01", title: "A" }, { id: 98, date: "2026-04-01", title: "B" }],
      testimonials: [],
      press_releases: [],
      memberships: [{ id: 10, status: "pending" }],
      help_requests: [{ id: 11, status: "new" }],
      help_request_updates: [],
      newsletter: [],
      contact_messages: [{ id: 12 }],
      users: [{ id: 30, status: "pending" }, { id: 31, status: "active" }],
      donations: [{ id: 20 }],
      petitions: [{ id: 21 }],
      family_links: [{ id: 22, status: "pending" }, { id: 23, status: "approved" }],
    };
  });

  it("returns published news sorted by newest date", () => {
    const rows = getPublishedNews();
    expect(rows.map((n) => n.id)).toEqual([3, 1]);
  });

  it("adds newsletter email once and rejects duplicates", () => {
    addNewsletter("john@example.org");
    expect(mockStore.newsletter).toHaveLength(1);
    expect(mockStore.newsletter[0]).toMatchObject({
      id: 999,
      email: "john@example.org",
    });

    expect(() => addNewsletter("JOHN@example.org")).toThrow("ALREADY_EXISTS");
    expect(mockStore.newsletter).toHaveLength(1);
  });

  it("computes admin stats with pending counters", () => {
    expect(getAdminStats()).toMatchObject({
      news: 3,
      memberships: 1,
      pending_memberships: 1,
      new_help: 1,
      users: 2,
      pending_users: 1,
      family_links: 2,
      pending_family_links: 1,
    });
  });

  it("adds membership/help/contact records", () => {
    addMembership({
      type: "famille",
      first_name: "Jean",
      last_name: "K",
      phone: "0999",
    });
    addHelpRequest({ first_name: "M", message: "Need support" });
    addContactMessage({ name: "A", email: "a@b.cd", message: "Hello" });
    expect(mockStore.memberships).toHaveLength(2);
    expect(mockStore.help_requests).toHaveLength(2);
    expect(mockStore.contact_messages).toHaveLength(2);
  });

  it("covers admin create/update/delete workflows", () => {
    adminCreate("news", { title: "N1", content: "Body" });
    adminCreate("studies", { title: "S1", content: "Study body" });
    adminCreate("campaigns", { title: "C1", description: "desc" });
    adminCreate("actions", { province: "Kin", title: "Action" });
    adminCreate("testimonials", { content: "Temoignage", anonymous: "1" });
    adminCreate("press_releases", { title: "Press", content: "CP" });

    expect(mockStore.news.length).toBeGreaterThanOrEqual(4);
    expect(mockStore.studies).toHaveLength(1);
    expect(mockStore.campaigns).toHaveLength(1);
    expect(mockStore.actions.length).toBeGreaterThanOrEqual(3);
    expect(mockStore.testimonials).toHaveLength(1);
    expect(mockStore.press_releases).toHaveLength(1);

    adminUpdateStatus("memberships", 10, "approved");
    adminUpdateStatus("help_requests", 11, "processing");
    expect(mockStore.memberships[0].status).toBe("approved");
    expect(mockStore.help_requests[0].status).toBe("processing");

    const firstNewsId = mockStore.news[0].id;
    adminDelete("news", firstNewsId);
    expect(mockStore.news.some((n: any) => n.id === firstNewsId)).toBe(false);
  });

  it("returns admin data bundles reversed collections", () => {
    const data = getAdminData();
    expect(Array.isArray(data.news)).toBe(true);
    expect(Array.isArray(data.help_requests)).toBe(true);
    expect(data.actions[0].id).toBe(98);
  });
});
