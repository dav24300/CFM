import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { checkRateLimitDistributed, getClientIp } from "@/lib/rate-limit";

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

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (request.method === "GET") return NextResponse.next();

  const strictPrefix = Object.keys(STRICT_PREFIXES).find((p) => pathname.startsWith(p));
  const limited = strictPrefix || LIMITED_PREFIXES.some((p) => pathname.startsWith(p));
  if (!limited) return NextResponse.next();

  const options = strictPrefix ? STRICT_PREFIXES[strictPrefix] : { windowMs: 60_000, max: 30 };
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
