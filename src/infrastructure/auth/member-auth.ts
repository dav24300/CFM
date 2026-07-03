import { cookies } from "next/headers";
import { signSessionPayload, verifySessionSignature } from "@/infrastructure/auth/session-crypto";
import type { PublicUser, User } from "@/domain/entities/v2";
import { getUserById } from "@/infrastructure/repositories/users.repository";
import { domainError } from "@/domain/errors/domain-error";
const COOKIE_NAME = "cfm_member_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 jours
const SESSION_NAMESPACE = "member";

export async function createMemberSession(userId: number): Promise<void> {
  const idStr = userId.toString();
  const token = `${idStr}.${signSessionPayload(idStr, SESSION_NAMESPACE)}`;
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE,
    path: "/",
  });
}

export async function destroyMemberSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getMemberSessionUserId(): Promise<number | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const [idStr, sig] = token.split(".");
  if (!idStr || !sig) return null;
  if (!verifySessionSignature(idStr, sig, SESSION_NAMESPACE)) return null;

  const id = parseInt(idStr, 10);
  return Number.isNaN(id) ? null : id;
}

export async function getLoggedInMember(): Promise<PublicUser | null> {
  const userId = await getMemberSessionUserId();
  if (!userId) return null;
  const user = getUserById(userId);
  if (!user || user.status === "suspended") return null;
  return toPublicUser(user);
}

export async function getCurrentMember(): Promise<PublicUser | null> {
  const user = await getLoggedInMember();
  if (!user || user.status !== "active") return null;
  return user;
}

export async function requireActiveMember(): Promise<PublicUser> {
  const user = await getCurrentMember();
  if (!user) throw domainError("UNAUTHORIZED");
  return user;
}

export function toPublicUser(user: User): PublicUser {
  const { password_hash: _, ...rest } = user;
  return rest;
}

export async function isVolunteerSession(): Promise<boolean> {
  const user = await getCurrentMember();
  return user?.role === "volunteer";
}
