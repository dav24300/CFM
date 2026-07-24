import { cache } from "react";
import { cookies } from "next/headers";
import { signSessionPayload, verifySessionSignature } from "@/infrastructure/auth/session-crypto";
import type { PublicUser, User } from "@/domain/entities/v2";
import { getUserById } from "@/infrastructure/repositories/users.repository";
import { domainError } from "@/domain/errors/domain-error";
const COOKIE_NAME = "cfm_member_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 jours
const SESSION_NAMESPACE = "member";

/**
 * Indice de session NON sensible (pas de httpOnly) : un simple drapeau "1"
 * lisible côté client. Le vrai jeton reste httpOnly et fait autorité côté
 * serveur. Cet indice sert au header du site public — devenu statique, il ne
 * peut plus lire la session serveur — à basculer le bon lien (« Mon espace »
 * vs « Se connecter ») dès l'hydratation, sans attendre la requête réseau.
 * Il ne donne AUCUN accès : falsifié, il ne fait que changer un libellé, et le
 * portail vérifie de toute façon la vraie session.
 */
const HINT_COOKIE_NAME = "cfm_member_hint";

export async function createMemberSession(userId: number): Promise<void> {
  const idStr = userId.toString();
  const issuedAt = Math.floor(Date.now() / 1000);
  const token = `${idStr}.${issuedAt}.${signSessionPayload(`${idStr}:${issuedAt}`, SESSION_NAMESPACE)}`;
  const cookieStore = await cookies();
  const secure = process.env.NODE_ENV === "production";
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE,
    path: "/",
  });
  cookieStore.set(HINT_COOKIE_NAME, "1", {
    httpOnly: false,
    secure,
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE,
    path: "/",
  });
}

export async function destroyMemberSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
  cookieStore.delete(HINT_COOKIE_NAME);
}

export async function getMemberSessionUserId(): Promise<number | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const [idStr, issuedAtStr, sig] = token.split(".");
  if (!idStr || !issuedAtStr || !sig) return null;
  if (!verifySessionSignature(`${idStr}:${issuedAtStr}`, sig, SESSION_NAMESPACE)) return null;

  const issuedAt = parseInt(issuedAtStr, 10);
  if (Number.isNaN(issuedAt)) return null;
  // Expiration serveur (7 jours) : rend le maxAge réellement contraignant.
  if (Math.floor(Date.now() / 1000) - issuedAt > SESSION_MAX_AGE) return null;

  const id = parseInt(idStr, 10);
  return Number.isNaN(id) ? null : id;
}

/**
 * Mémoïsé par requête (React.cache) : chaque écran du portail appelait cette
 * fonction depuis le layout PUIS depuis la page, et `isVolunteerSession` /
 * `isCoordinatorSession` la rappelaient encore — soit 2 à 4 `SELECT * FROM
 * users WHERE id = $1` identiques par navigation. Le cache est vidé entre
 * deux requêtes : aucun risque de fuite de session d'un utilisateur à l'autre.
 */
export const getLoggedInMember = cache(async function getLoggedInMember(): Promise<PublicUser | null> {
  const userId = await getMemberSessionUserId();
  if (!userId) return null;
  const user = await getUserById(userId);
  if (!user || user.status === "suspended") return null;
  return toPublicUser(user);
});

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

export async function isCoordinatorSession(): Promise<boolean> {
  const user = await getCurrentMember();
  return user?.role === "coordinator";
}
