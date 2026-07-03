import { createHmac, timingSafeEqual } from "crypto";

export function getSessionSecret(): string {
  return process.env.SESSION_SECRET || "dev-secret-change-in-production";
}

export function signSessionPayload(payload: string, namespace?: string): string {
  const message = namespace ? `${namespace}:${payload}` : payload;
  return createHmac("sha256", getSessionSecret()).update(message).digest("hex");
}

export function verifySessionSignature(
  payload: string,
  signature: string,
  namespace?: string
): boolean {
  const expected = signSessionPayload(payload, namespace);
  try {
    return timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
}
