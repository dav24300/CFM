import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { checkRateLimitDistributed, getClientIp } from "@/infrastructure/rate-limit/memory";

const LIMITED_PREFIXES = [
  "/api/contact",
  "/api/help",
  "/api/newsletter",
  "/api/membership",
  "/api/donations",
  "/api/petitions",
  "/api/live",
  "/api/member/register",
  "/api/member/login",
  "/api/member/forgot-password",
  // P2.5 — endpoints publics jusqu'ici sans aucune limite :
  "/api/push",
  "/api/member/reset-password",
];

// Endpoints d'authentification à fort enjeu : plafond bien plus strict
// (anti-brute-force du mot de passe admin unique).
const STRICT_PREFIXES: Record<string, { windowMs: number; max: number }> = {
  "/api/admin/login": { windowMs: 15 * 60_000, max: 10 },
};

function envInt(name: string, fallback: number): number {
  const parsed = Number.parseInt(process.env[name] ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

/**
 * Le défaut (30 req/min) convient à des formulaires diffus, PAS à un
 * rassemblement : la clé de comptage est `IP:route`, et sous NAT opérateur
 * (courant en RDC) comme derrière un wifi d'événement, des centaines de
 * personnes partagent une seule IP publique. 30 inscriptions dans la même
 * minute épuisaient le seau et toutes les suivantes recevaient un 429.
 *
 * Dimensionnement : 300 inscriptions × ~1,6 de reprises (double-tap, formulaire
 * rejeté — le middleware compte AVANT le handler) ≈ 480 requêtes, dont environ
 * la moitié concentrée sur 10 minutes → ~240. Plafond posé à 500 : marge ×2.
 * Le coût d'abus au plafond reste borné (~8 % d'un vCPU, dominé par bcrypt).
 *
 * Réglable par variables d'environnement pour ajuster sans toucher au code.
 */
const SIGNUP_PREFIXES = ["/api/member/register", "/api/membership"];
const LOGIN_PREFIXES = ["/api/member/login"];

const DEFAULT_LIMIT = { windowMs: 60_000, max: 30 };
const SIGNUP_LIMIT = {
  windowMs: envInt("CFM_RL_SIGNUP_WINDOW_MS", 600_000),
  max: envInt("CFM_RL_SIGNUP_MAX", 500),
};
// La même foule se connectera juste après activation, depuis la même IP.
// Desserré aussi, mais moins : c'est une surface de force brute.
const LOGIN_LIMIT = {
  windowMs: envInt("CFM_RL_LOGIN_WINDOW_MS", 600_000),
  max: envInt("CFM_RL_LOGIN_MAX", 200),
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (request.method === "GET") return NextResponse.next();

  const strictPrefix = Object.keys(STRICT_PREFIXES).find((p) => pathname.startsWith(p));
  const limited = strictPrefix || LIMITED_PREFIXES.some((p) => pathname.startsWith(p));
  if (!limited) return NextResponse.next();

  const options = strictPrefix
    ? STRICT_PREFIXES[strictPrefix]
    : SIGNUP_PREFIXES.some((p) => pathname.startsWith(p))
      ? SIGNUP_LIMIT
      : LOGIN_PREFIXES.some((p) => pathname.startsWith(p))
        ? LOGIN_LIMIT
        : DEFAULT_LIMIT;
  const ip = getClientIp(request);
  const key = `${ip}:${pathname.split("/").slice(0, 4).join("/")}`;
  const { ok, retryAfter } = await checkRateLimitDistributed(key, options);

  if (!ok) {
    return NextResponse.json(
      { error: "Trop de requêtes. Réessayez plus tard." },
      { status: 429, headers: retryAfter ? { "Retry-After": String(retryAfter) } : {} }
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*"],
};
