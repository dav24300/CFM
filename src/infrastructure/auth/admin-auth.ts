import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { signSessionPayload, verifySessionSignature } from "@/infrastructure/auth/session-crypto";

const COOKIE_NAME = "cfm_admin_session";
const SESSION_MAX_AGE = 60 * 60 * 24; // 24h
const SESSION_PAYLOAD = "authenticated";

export async function createSession(): Promise<void> {
  const token = signSessionPayload(SESSION_PAYLOAD);
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE,
    path: "/",
  });
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return false;
  return verifySessionSignature(SESSION_PAYLOAD, token);
}

/** Accepte mot de passe plain-text ou hash bcrypt ($2…) dans ADMIN_PASSWORD */
export function verifyPassword(password: string): boolean {
  const adminPassword = process.env.ADMIN_PASSWORD || "admin123";
  if (adminPassword.startsWith("$2")) {
    return bcrypt.compareSync(password, adminPassword);
  }
  return password === adminPassword;
}
