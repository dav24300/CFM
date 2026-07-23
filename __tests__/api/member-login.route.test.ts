import { describe, expect, it, vi } from "vitest";

const mocked = vi.hoisted(() => ({
  loginMember: vi.fn(),
}));

vi.mock("@/application/services/member.service", () => ({
  loginMember: mocked.loginMember,
}));

import { POST } from "@/app/api/member/login/route";
import { domainError } from "@/domain/errors/domain-error";

describe("POST /api/member/login", () => {
  it("returns 400 when required fields are missing", async () => {
    const req = new Request("http://localhost/api/member/login", {
      method: "POST",
      body: JSON.stringify({ email: "" }),
      headers: { "Content-Type": "application/json" },
    }) as any;

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body).toMatchObject({ error: "Champs requis" });
  });

  it("creates session and returns success for valid credentials", async () => {
    mocked.loginMember.mockResolvedValueOnce({
      id: 9,
      email: "a@b.cd",
      status: "active",
      first_name: "A",
      last_name: "B",
    });

    const req = new Request("http://localhost/api/member/login", {
      method: "POST",
      body: JSON.stringify({ email: "a@b.cd", password: "secret123" }),
      headers: { "Content-Type": "application/json" },
    }) as any;

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(mocked.loginMember).toHaveBeenCalledWith("a@b.cd", "secret123");
    expect(body).toMatchObject({ success: true, user: { id: 9, email: "a@b.cd" } });
  });

  it("returns 403 with explicit message for a pending account", async () => {
    mocked.loginMember.mockRejectedValueOnce(domainError("ACCOUNT_PENDING"));

    const req = new Request("http://localhost/api/member/login", {
      method: "POST",
      body: JSON.stringify({ email: "p@b.cd", password: "secret123" }),
      headers: { "Content-Type": "application/json" },
    }) as any;

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.error).toContain("attente de validation");
  });

  it("returns 403 for a suspended account", async () => {
    mocked.loginMember.mockRejectedValueOnce(domainError("ACCOUNT_SUSPENDED"));

    const req = new Request("http://localhost/api/member/login", {
      method: "POST",
      body: JSON.stringify({ email: "s@b.cd", password: "secret123" }),
      headers: { "Content-Type": "application/json" },
    }) as any;

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.error).toContain("suspendu");
  });
});
