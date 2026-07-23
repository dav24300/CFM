import { describe, expect, it, vi, beforeEach } from "vitest";

const mocked = vi.hoisted(() => ({
  verifyUserPassword: vi.fn(),
  createMemberSession: vi.fn(),
}));

vi.mock("@/infrastructure/repositories/users.repository", () => ({
  registerUser: vi.fn(),
  verifyUserPassword: mocked.verifyUserPassword,
  updateMemberProfile: vi.fn(),
  getUserByEmail: vi.fn(),
  getUserById: vi.fn(),
  getHelpRequestsForUser: vi.fn(),
}));

vi.mock("@/infrastructure/auth/member-auth", () => ({
  createMemberSession: mocked.createMemberSession,
  destroyMemberSession: vi.fn(),
  getCurrentMember: vi.fn(),
  getMemberSessionUserId: vi.fn(),
  toPublicUser: (u: Record<string, unknown>) => {
    const { password_hash: _, ...rest } = u;
    return rest;
  },
}));

import { loginMember } from "@/application/services/member.service";

const baseUser = {
  id: 7,
  email: "m@cfm.cd",
  password_hash: "hash",
  first_name: "M",
  last_name: "K",
  status: "active",
};

describe("loginMember — statut du compte", () => {
  beforeEach(() => {
    mocked.verifyUserPassword.mockReset();
    mocked.createMemberSession.mockReset();
  });

  it("creates a session for an active account", async () => {
    mocked.verifyUserPassword.mockResolvedValueOnce({ ...baseUser });
    const user = await loginMember("m@cfm.cd", "pass");
    expect(user).toMatchObject({ id: 7, status: "active" });
    expect(mocked.createMemberSession).toHaveBeenCalledWith(7);
  });

  it("rejects a pending account WITHOUT creating a session", async () => {
    mocked.verifyUserPassword.mockResolvedValueOnce({ ...baseUser, status: "pending" });
    await expect(loginMember("m@cfm.cd", "pass")).rejects.toMatchObject({
      code: "ACCOUNT_PENDING",
    });
    expect(mocked.createMemberSession).not.toHaveBeenCalled();
  });

  it("rejects a suspended account WITHOUT creating a session", async () => {
    mocked.verifyUserPassword.mockResolvedValueOnce({ ...baseUser, status: "suspended" });
    await expect(loginMember("m@cfm.cd", "pass")).rejects.toMatchObject({
      code: "ACCOUNT_SUSPENDED",
    });
    expect(mocked.createMemberSession).not.toHaveBeenCalled();
  });

  it("returns null on invalid credentials (pas d'énumération de statut)", async () => {
    mocked.verifyUserPassword.mockResolvedValueOnce(null);
    expect(await loginMember("m@cfm.cd", "wrong")).toBeNull();
    expect(mocked.createMemberSession).not.toHaveBeenCalled();
  });
});
