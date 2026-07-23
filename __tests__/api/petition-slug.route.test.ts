import { describe, expect, it, vi } from "vitest";

const mocked = vi.hoisted(() => ({
  getPetition: vi.fn(),
  signPetitionBySlug: vi.fn(),
}));

vi.mock("@/application/services/petition.service", () => ({
  getPetition: mocked.getPetition,
  signPetitionBySlug: mocked.signPetitionBySlug,
}));

import { GET, POST } from "@/app/api/petitions/[slug]/route";

describe("/api/petitions/[slug] route", () => {
  it("GET returns 404 when petition does not exist", async () => {
    mocked.getPetition.mockReturnValueOnce(undefined);
    const req = new Request("http://localhost/api/petitions/missing") as any;
    const res = await GET(req, { params: Promise.resolve({ slug: "missing" }) });
    const body = await res.json();
    expect(res.status).toBe(404);
    expect(body).toEqual({ error: "Non trouvé" });
  });

  it("POST returns 400 when name and email are empty", async () => {
    mocked.getPetition.mockReturnValueOnce({ id: 44, slug: "x" });
    mocked.signPetitionBySlug.mockRejectedValueOnce(new Error("MISSING_SIGNER"));

    const req = new Request("http://localhost/api/petitions/x", {
      method: "POST",
      body: JSON.stringify({}),
      headers: { "Content-Type": "application/json" },
    }) as any;

    const res = await POST(req, { params: Promise.resolve({ slug: "x" }) });
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body).toEqual({ error: "Nom et email obligatoires" });
  });

  it("POST signs petition using member fallback identity", async () => {
    mocked.getPetition.mockReturnValueOnce({ id: 45, slug: "reforme" });
    // La signature renvoie désormais le total à jour, que la route relaie au
    // client (il affichait auparavant un compteur périmé).
    mocked.signPetitionBySlug.mockResolvedValueOnce({ signatures_count: 43 });

    const req = new Request("http://localhost/api/petitions/reforme", {
      method: "POST",
      body: JSON.stringify({}),
      headers: { "Content-Type": "application/json" },
    }) as any;

    const res = await POST(req, { params: Promise.resolve({ slug: "reforme" }) });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({ success: true, signatures_count: 43 });
    expect(mocked.signPetitionBySlug).toHaveBeenCalledWith("reforme", {});
  });
});
