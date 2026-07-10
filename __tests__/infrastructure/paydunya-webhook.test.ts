import { describe, expect, it } from "vitest";
import { createHmac } from "crypto";
import { verifyPayDunyaWebhookHash } from "@/infrastructure/payment/paydunya.adapter";

describe("PayDunya webhook signature", () => {
  const masterKey = "test-master-key-32chars-minimum!!";
  const rawBody = JSON.stringify({
    status: "completed",
    data: { custom_data: { donation_id: "1" } },
  });

  it("rejects empty hash", () => {
    expect(verifyPayDunyaWebhookHash("", masterKey, rawBody)).toBe(false);
  });

  it("rejects invalid signature", () => {
    expect(verifyPayDunyaWebhookHash("invalid-signature", masterKey, rawBody)).toBe(
      false
    );
  });

  it("accepts valid HMAC-SHA256 signature", () => {
    const expected = createHmac("sha256", masterKey).update(rawBody).digest("hex");
    expect(verifyPayDunyaWebhookHash(expected, masterKey, rawBody)).toBe(true);
  });

  it("accepts legacy master key match", () => {
    expect(verifyPayDunyaWebhookHash(masterKey, masterKey)).toBe(true);
  });
});
