import { beforeEach, describe, expect, it, vi } from "vitest";

let mockStore: any;

const mockedUsers = vi.hoisted(() => ({
  getUserByEmail: vi.fn(),
  getUserById: vi.fn(),
}));

vi.mock("@/infrastructure/persistence/store-access", () => ({
  getStore: vi.fn(() => mockStore),
  updateStore: vi.fn((mutator: (store: any) => void) => mutator(mockStore)),
  nextId: vi.fn(() => {
    mockStore._counters.global += 1;
    return mockStore._counters.global;
  }),
}));

vi.mock("@/infrastructure/persistence/store.impl", () => ({
  slugify: vi.fn((value: string) => value.toLowerCase().replace(/\s+/g, "-")),
}));

vi.mock("@/infrastructure/repositories/users.repository", () => ({
  getUserByEmail: mockedUsers.getUserByEmail,
  getUserById: mockedUsers.getUserById,
}));

vi.mock("@/infrastructure/live/moderation", () => ({
  sanitizeChatContent: vi.fn((txt: string) => txt.trim()),
  containsBadWord: vi.fn((txt: string) => txt.includes("badword")),
}));

import {
  createDonation,
  completeDonation,
  getDonationsForUser,
} from "@/infrastructure/repositories/donations.repository";
import {
  getActivePetitions,
  signPetition,
  createPetition,
  getPetitionSignatures,
} from "@/infrastructure/repositories/petitions.repository";
import {
  requestFamilyLinkByParent,
  requestFamilyLinkByChild,
  respondFamilyLink,
  adminApproveFamilyLink,
} from "@/infrastructure/repositories/family-links.repository";
import {
  createLiveEvent,
  setLiveEventStatus,
  postChatMessage,
  createLivePoll,
  voteLivePoll,
  incrementViewerCount,
  getPendingChatCount,
} from "@/infrastructure/repositories/live.repository";

describe("domain repositories", () => {
  beforeEach(() => {
    mockStore = {
      _counters: { global: 100 },
      donations: [],
      petitions: [{ id: 1, slug: "reforme", active: 1, signatures_count: 0 }],
      petition_signatures: [],
      family_links: [],
      live_events: [{ id: 8, slug: "fikin", status: "scheduled", chat_moderation: 0, viewer_count: 0 }],
      live_chat_messages: [],
      live_polls: [],
      live_poll_votes: [],
    };
    mockedUsers.getUserByEmail.mockReset();
    mockedUsers.getUserById.mockReset();
  });

  it("handles donations lifecycle", () => {
    const d = createDonation({
      amount: 50,
      currency: "USD",
      provider: "orange",
      phone: "0999",
      user_id: 7,
    });
    expect(d.status).toBe("pending");
    const completed = completeDonation(d.id, "tx-1");
    expect(completed?.status).toBe("completed");
    expect(getDonationsForUser(7)).toHaveLength(1);
  });

  it("creates and signs petitions with duplicate protection", () => {
    expect(getActivePetitions()).toHaveLength(1);
    const created = createPetition({
      title: "Protection Familles",
      description: "Desc",
      goal: 1000,
    });
    expect(created.slug).toBe("protection-familles");

    signPetition({
      petition_id: 1,
      email: "a@b.cd",
      name: "A B",
    });
    expect(getPetitionSignatures(1)).toHaveLength(1);
    expect(() =>
      signPetition({
        petition_id: 1,
        email: "A@B.CD",
        name: "Again",
      })
    ).toThrow("ALREADY_SIGNED");
  });

  it("creates family link and supports approval transitions", () => {
    mockedUsers.getUserByEmail.mockReturnValueOnce({ id: 90 });
    mockedUsers.getUserById.mockReturnValueOnce({ id: 10, membership_type: "famille" });
    const link = requestFamilyLinkByParent({
      parent_user_id: 10,
      child_email: "kid@cfm.org",
      relationship: "enfant",
    });
    expect(link.status).toBe("pending_child");

    respondFamilyLink(link.id, 90, true);
    expect(mockStore.family_links[0].status).toBe("approved");

    adminApproveFamilyLink(link.id);
    expect(mockStore.family_links[0].status).toBe("approved");
  });

  it("covers child-initiated links and forbidden responses", () => {
    mockedUsers.getUserByEmail.mockReturnValueOnce({ id: 55 });
    const childLink = requestFamilyLinkByChild({
      child_user_id: 77,
      parent_email: "parent@cfm.org",
      relationship: "parent",
    });
    expect(childLink.status).toBe("pending_parent");

    expect(() => respondFamilyLink(childLink.id, 999, true)).toThrow("FORBIDDEN");
    respondFamilyLink(childLink.id, 55, false);
    expect(mockStore.family_links[0].status).toBe("rejected");
  });

  it("runs live flow: create, start, chat, poll, vote, viewers", () => {
    const ev = createLiveEvent({ title: "Live FIKIN", description: "desc", chat_moderation: true });
    expect(ev.slug).toBe("live-fikin");

    setLiveEventStatus(ev.id, "live");
    const chat = postChatMessage({
      live_event_id: ev.id,
      author_name: "Alice",
      content: "hello all",
    });
    expect(chat.status).toBe("pending");

    const poll = createLivePoll(ev.id, "Q?", ["Yes", "No"]);
    voteLivePoll(poll.id, "opt-1", "ip-1");
    expect(() => voteLivePoll(poll.id, "opt-1", "ip-1")).toThrow("ALREADY_VOTED");

    incrementViewerCount(ev.id);
    expect(getPendingChatCount(ev.id)).toBe(1);
  });

  it("covers live event terminal status updates", () => {
    const ev = createLiveEvent({ title: "Live 2", description: "desc" });
    setLiveEventStatus(ev.id, "ended", "https://replay");
    const ended = mockStore.live_events.find((x: any) => x.id === ev.id);
    expect(ended.ended_at).toBeTruthy();
    expect(ended.replay_url).toBe("https://replay");
  });
});
