import { beforeEach, describe, expect, it, vi } from "vitest";

let mockStore: any;

vi.mock("bcryptjs", () => ({
  default: {
    hash: vi.fn(async () => "mock-hash"),
    compare: vi.fn(async () => true),
  },
}));

vi.mock("@/infrastructure/persistence/store-access", () => ({
  getStoreAsync: vi.fn(() => Promise.resolve(mockStore)),
  updateStoreAsync: vi.fn((mutator: (store: any) => void) => {
    mutator(mockStore);
    return Promise.resolve(mockStore);
  }),
  nextId: vi.fn(() => 42),
}));

vi.mock("@/infrastructure/encryption/aes.adapter", () => ({
  decryptHelpRequest: vi.fn((payload: Record<string, unknown>) => payload),
}));

import { activateUser, addHelpRequestUpdate, getHelpRequestUpdates } from "@/infrastructure/repositories/users.repository";
import {
  getAllUsers,
  getHelpRequestsForUser,
  getUserByEmail,
  registerUser,
  suspendUser,
  updateMemberProfile,
  verifyUserPassword,
} from "@/infrastructure/repositories/users.repository";

describe("users.repository", () => {
  beforeEach(() => {
    mockStore = {
      users: [
        {
          id: 1,
          email: "user@cfm.org",
          password_hash: "hash",
          first_name: "Old",
          last_name: "Name",
          phone: "0101",
          membership_type: "famille",
          status: "pending",
          verified_at: null,
        },
      ],
      help_requests: [{ id: 100, status: "new", user_id: 1, email: "user@cfm.org", phone: "0101" }],
      help_request_updates: [],
      _counters: { global: 1 },
    };
  });

  it("activates user and sets verified date", async () => {
    const activated = await activateUser(1);
    expect(activated?.status).toBe("active");
    expect(activated?.verified_at).toBeTruthy();
    expect(mockStore.users[0].status).toBe("active");
  });

  it("creates help request update and mirrors status to request", async () => {
    const update = await addHelpRequestUpdate({
      help_request_id: 100,
      status: "processing",
      note: "Contacted family",
      updated_by: "admin",
    });

    expect(update).toMatchObject({
      id: 42,
      help_request_id: 100,
      status: "processing",
      note: "Contacted family",
      updated_by: "admin",
    });
    expect(mockStore.help_requests[0].status).toBe("processing");
    expect(await getHelpRequestUpdates(100)).toHaveLength(1);
  });

  it("registers user and validates credential flow", async () => {
    const created = await registerUser({
      email: "new@cfm.org",
      password: "longsecret",
      first_name: "New",
      last_name: "User",
      phone: "0999",
      membership_type: "soutien",
    });
    expect(created.email).toBe("new@cfm.org");
    expect((await getUserByEmail("NEW@CFM.ORG"))?.id).toBe(created.id);
    const ok = await verifyUserPassword("new@cfm.org", "longsecret");
    expect(ok?.id).toBe(created.id);
  });

  it("updates profile, suspends user and exposes user collections", async () => {
    const updated = await updateMemberProfile(1, {
      first_name: "Jane",
      phone: "0900",
    });
    expect(updated?.first_name).toBe("Jane");
    expect(updated?.phone).toBe("0900");

    await suspendUser(1);
    expect(mockStore.users[0].status).toBe("suspended");
    expect(await getAllUsers()).toHaveLength(1);
  });

  it("returns help requests resolved for user identities", async () => {
    const list = await getHelpRequestsForUser(1);
    expect(list).toHaveLength(1);
  });
});
