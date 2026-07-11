import { createHmac, timingSafeEqual } from "crypto";

const DEFAULT_SESSION_SECRET = "dev-secret-change-in-production";

export function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret === DEFAULT_SESSION_SECRET) {
    // Fail-closed en production runtime : ne jamais signer/vérifier une session
    // avec un secret par défaut connu (cookies forgeables). Le build (SSG) et le
    // développement restent tolérants pour ne pas casser la génération/preview.
    const isBuildTime = process.env.NEXT_PHASE === "phase-production-build";
    if (process.env.NODE_ENV === "production" && !isBuildTime) {
      throw new Error(
        "[CFM] SESSION_SECRET manquant ou laissé à la valeur par défaut : configuration de production invalide (sessions non sécurisées)."
      );
    }
    return DEFAULT_SESSION_SECRET;
  }
  return secret;
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
