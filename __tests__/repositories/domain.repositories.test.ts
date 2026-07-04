import { beforeEach, describe, expect, it, vi } from "vitest";

let mockStore: any;

const mockedUsers = vi.hoisted(() => ({
  getUserByEmail: vi.fn(),
  getUserById: vi.fn(),
}));

vi.mock("@/infrastructure/persistence/store-access", () => ({
  getStoreAsync: vi.fn(() => Promise.resolve(mockStore)),
  updateStoreAsync: vi.fn((mutator: (store: any) => void) => {
    mutator(mockStore);
    return Promise.resolve(mockStore);
  }),
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

  it("handles donations lifecycle", async () => {
    const d = await createDonation({
      amount: 50,
      currency: "USD",
      provider: "orange",
      phone: "0999",
      user_id: 7,
    });
    expect(d.status).toBe("pending");
    const completed = await completeDonation(d.id, "tx-1");
    expect(completed?.status).toBe("completed");
    expect(await getDonationsForUser(7)).toHaveLength(1);
  });

  it("creates and signs petitions with duplicate protection", async () => {
    expect(await getActivePetitions()).toHaveLength(1);
    const created = await createPetition({
      title: "Protection Familles",
      description: "Desc",
      goal: 1000,
    });
    expect(created.slug).toBe("protection-familles");

    await signPetition({
      petition_id: 1,
      email: "a@b.cd",
      name: "A B",
    });
    expect(await getPetitionSignatures(1)).toHaveLength(1);
    await expect(
      signPetition({
        petition_id: 1,
        email: "A@B.CD",
        name: "Again",
      })
    ).rejects.toThrow("ALREADY_SIGNED");
  });

  it("creates family link and supports approval transitions", async () => {
    mockedUsers.getUserByEmail.mockReturnValueOnce({ id: 90 });
    mockedUsers.getUserById.mockReturnValueOnce({ id: 10, membership_type: "famille" });
    const link = await requestFamilyLinkByParent({
      parent_user_id: 10,
      child_email: "kid@cfm.org",
      relationship: "enfant",
    });
    expect(link.status).toBe("pending_child");

    await respondFamilyLink(link.id, 90, true);
    expect(mockStore.family_links[0].status).toBe("approved");

    await adminApproveFamilyLink(link.id);
    expect(mockStore.family_links[0].status).toBe("approved");
  });

  it("covers child-initiated links and forbidden responses", async () => {
    mockedUsers.getUserByEmail.mockReturnValueOnce({ id: 55 });
    const childLink = await requestFamilyLinkByChild({
      child_user_id: 77,
      parent_email: "parent@cfm.org",
      relationship: "parent",
    });
    expect(childLink.status).toBe("pending_parent");

    await expect(respondFamilyLink(childLink.id, 999, true)).rejects.toThrow("FORBIDDEN");
    await respondFamilyLink(childLink.id, 55, false);
    expect(mockStore.family_links[0].status).toBe("rejected");
  });

  it("runs live flow: create, start, chat, poll, vote, viewers", async () => {
    const ev = await createLiveEvent({ title: "Live FIKIN", description: "desc", chat_moderation: true });
    expect(ev.slug).toBe("live-fikin");

    await setLiveEventStatus(ev.id, "live");
    const chat = await postChatMessage({
      live_event_id: ev.id,
      author_name: "Alice",
      content: "hello all",
    });
    expect(chat.status).toBe("pending");

    const poll = await createLivePoll(ev.id, "Q?", ["Yes", "No"]);
    await voteLivePoll(poll.id, "opt-1", "ip-1");
    await expect(voteLivePoll(poll.id, "opt-1", "ip-1")).rejects.toThrow("ALREADY_VOTED");

    await incrementViewerCount(ev.id);
    expect(await getPendingChatCount(ev.id)).toBe(1);
  });

  it("covers live event terminal status updates", async () => {
    const ev = await createLiveEvent({ title: "Live 2", description: "desc" });
    await setLiveEventStatus(ev.id, "ended", "https://replay");
    const ended = mockStore.live_events.find((x: any) => x.id === ev.id);
    expect(ended.ended_at).toBeTruthy();
    expect(ended.replay_url).toBe("https://replay");
  });
});
