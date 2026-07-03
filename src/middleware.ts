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
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (request.method === "GET") return NextResponse.next();

  const limited = LIMITED_PREFIXES.some((p) => pathname.startsWith(p));
  if (!limited) return NextResponse.next();

  const ip = getClientIp(request);
  const key = `${ip}:${pathname.split("/").slice(0, 4).join("/")}`;
  const { ok, retryAfter } = await checkRateLimitDistributed(key, {
    windowMs: 60_000,
    max: 30,
  });

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
