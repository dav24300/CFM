import bcrypt from "bcryptjs";
import { createHash, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { signSessionPayload, verifySessionSignature } from "@/infrastructure/auth/session-crypto";

const COOKIE_NAME = "cfm_admin_session";
const SESSION_MAX_AGE = 60 * 60 * 24; // 24h
const SESSION_PAYLOAD = "authenticated";

export const ADMIN_SESSION_COOKIE_NAME = COOKIE_NAME;

export function createSessionToken(): string {
  // Horodatage d'émission signé : rend le jeton expirable côté serveur.
  const issuedAt = Math.floor(Date.now() / 1000);
  return `${issuedAt}.${signSessionPayload(`${SESSION_PAYLOAD}:${issuedAt}`)}`;
}

export function getAdminSessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: SESSION_MAX_AGE,
    path: "/",
  };
}

export async function createSession(): Promise<void> {
  const token = createSessionToken();
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, getAdminSessionCookieOptions());
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return false;
  const [issuedAtStr, sig] = token.split(".");
  if (!issuedAtStr || !sig) return false;
  if (!verifySessionSignature(`${SESSION_PAYLOAD}:${issuedAtStr}`, sig)) return false;
  const issuedAt = parseInt(issuedAtStr, 10);
  if (Number.isNaN(issuedAt)) return false;
  // Expiration serveur : un cookie exfiltré ne reste pas valable indéfiniment.
  if (Math.floor(Date.now() / 1000) - issuedAt > SESSION_MAX_AGE) return false;
  return true;
}

/**
 * Vérifie le mot de passe admin. Accepte un hash bcrypt ($2…) — recommandé — ou
 * un secret en clair (comparé à temps constant). Fail-closed : si ADMIN_PASSWORD
 * n'est pas défini, aucune connexion n'est possible (plus de fallback "admin123").
 */
export function verifyPassword(password: string): boolean {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) return false;
  if (adminPassword.startsWith("$2")) {
    return bcrypt.compareSync(password, adminPassword);
  }
  // Comparaison à temps constant, indépendante de la longueur (hash SHA-256).
  const a = createHash("sha256").update(password).digest();
  const b = createHash("sha256").update(adminPassword).digest();
  return timingSafeEqual(a, b);
}
