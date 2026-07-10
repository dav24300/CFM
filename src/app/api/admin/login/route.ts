import { NextRequest, NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE_NAME,
  createSessionToken,
  getAdminSessionCookieOptions,
  verifyPassword,
} from "@/infrastructure/auth/admin-auth";
import { logAdminAction } from "@/lib/admin-audit";
import { jsonError, jsonUnauthorized } from "@/lib/api-response";

function attachSessionCookie(response: NextResponse, token: string): NextResponse {
  response.cookies.set(
    ADMIN_SESSION_COOKIE_NAME,
    token,
    getAdminSessionCookieOptions()
  );
  return response;
}

async function readPassword(request: NextRequest): Promise<string> {
  const contentType = request.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    const body = await request.json();
    return String(body.password || "");
  }
  const form = await request.formData();
  return String(form.get("password") || "");
}

function wantsHtmlRedirect(request: NextRequest): boolean {
  const contentType = request.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) return true;
  const accept = request.headers.get("accept") || "";
  return accept.includes("text/html");
}

export async function POST(request: NextRequest) {
  try {
    const password = await readPassword(request);
    const ip = request.headers.get("x-forwarded-for");
    const htmlFlow = wantsHtmlRedirect(request);

    if (!verifyPassword(password)) {
      void logAdminAction({
        actorType: "unknown",
        endpoint: "/api/admin/login",
        action: "login",
        status: "denied",
        ip,
      });
      if (htmlFlow) {
        const url = new URL("/admin", request.url);
        url.searchParams.set("error", "1");
        return NextResponse.redirect(url, 303);
      }
      return jsonUnauthorized("Mot de passe incorrect");
    }

    const token = createSessionToken();
    void logAdminAction({
      actorType: "admin",
      endpoint: "/api/admin/login",
      action: "login",
      status: "success",
      ip,
    });

    if (htmlFlow) {
      const response = NextResponse.redirect(new URL("/admin/dashboard", request.url), 303);
      return attachSessionCookie(response, token);
    }

    return attachSessionCookie(NextResponse.json({ success: true }), token);
  } catch {
    return jsonError("Erreur serveur", 500);
  }
}
