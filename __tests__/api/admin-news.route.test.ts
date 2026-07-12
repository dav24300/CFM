import { describe, expect, it, vi } from "vitest";
import { jsonForbidden } from "@/infrastructure/http/api-response";

const mocked = vi.hoisted(() => ({
  requireAdminRole: vi.fn(),
  getAdminData: vi.fn(),
  adminCreate: vi.fn(),
}));

vi.mock("@/lib/admin-rest", () => ({
  requireAdminRole: mocked.requireAdminRole,
}));

// P2.4 : la factory de routes passe par le repository (createContentItem et
// getAdminData) — on mocke la source directe.
vi.mock("@/infrastructure/repositories/content.repository", () => ({
  getAdminData: mocked.getAdminData,
  adminCreate: mocked.adminCreate,
  adminDelete: vi.fn(),
  adminUpdateContent: vi.fn(),
}));

import { GET, POST } from "@/app/api/admin/news/route";

describe("/api/admin/news route", () => {
  it("GET denies access when not authorized", async () => {
    mocked.requireAdminRole.mockResolvedValueOnce({
      ok: false,
      response: jsonForbidden("Accès refusé"),
    });
    const res = await GET();
    expect(res.status).toBe(403);
  });

  it("GET returns news for authorized admin", async () => {
    mocked.requireAdminRole.mockResolvedValueOnce({ ok: true });
    mocked.getAdminData.mockReturnValueOnce({ news: [{ id: 1, title: "A" }] });
    const res = await GET();
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body).toEqual({ news: [{ id: 1, title: "A" }] });
  });

  it("POST validates payload and creates news entry", async () => {
    mocked.requireAdminRole.mockResolvedValueOnce({ ok: true });

    const req = new Request("http://localhost/api/admin/news", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Titre",
        content: "Contenu",
        category: "actualite",
      }),
    }) as any;

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({ success: true });
    expect(mocked.adminCreate).toHaveBeenCalledWith(
      "news",
      expect.objectContaining({ title: "Titre", content: "Contenu" })
    );
  });
});
