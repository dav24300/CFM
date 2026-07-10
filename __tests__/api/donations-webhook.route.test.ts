import { afterEach, describe, expect, it, vi } from "vitest";

const mocked = vi.hoisted(() => ({
  handleDonationWebhook: vi.fn(),
}));

vi.mock("@/application/services/donation.service", () => ({
  handleDonationWebhook: mocked.handleDonationWebhook,
}));

import { POST } from "@/app/api/donations/webhook/route";

const masterKey = "test-master-key-32chars-minimum!!";
const rawBody = JSON.stringify({
  status: "pending",
  data: { custom_data: { donation_id: "1" } },
});

function makeRequest(headers: Record<string, string> = {}) {
  return new Request("http://localhost/api/donations/webhook", {
    method: "POST",
    body: rawBody,
    headers: { "Content-Type": "application/json", ...headers },
  }) as any;
}

describe("POST /api/donations/webhook", () => {
  const env = { ...process.env };

  afterEach(() => {
    process.env = { ...env };
    vi.clearAllMocks();
  });

  it("returns 401 for missing signature in production mode", async () => {
    process.env.PAYDUNYA_MASTER_KEY = masterKey;
    process.env.MOBILE_MONEY_MODE = "production";

    const res = await POST(makeRequest());
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body).toMatchObject({ error: "Signature manquante" });
  });

  it("accepts unsigned webhook in demo mode", async () => {
    process.env.PAYDUNYA_MASTER_KEY = masterKey;
    process.env.MOBILE_MONEY_MODE = "demo";

    const res = await POST(makeRequest());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toMatchObject({ received: true });
  });

  it("returns 401 for invalid signature in production mode", async () => {
    process.env.PAYDUNYA_MASTER_KEY = masterKey;
    process.env.MOBILE_MONEY_MODE = "production";

    const res = await POST(
      makeRequest({ "PAYDUNYA-SIGNATURE": "invalid-signature-hex" })
    );
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body).toMatchObject({ error: "Signature invalide" });
  });

  it("returns 500 when production mode has no PayDunya keys", async () => {
    delete process.env.PAYDUNYA_MASTER_KEY;
    process.env.MOBILE_MONEY_MODE = "production";

    const res = await POST(makeRequest());
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBeTruthy();
  });
});
