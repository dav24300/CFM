import { NextRequest } from "next/server";
import { LOCALES } from "@/lib/i18n";
import { jsonError, jsonSuccess } from "@/infrastructure/http/api-response";

export async function POST(request: NextRequest) {
  const { locale } = await request.json();
  if (!LOCALES.includes(locale)) {
    return jsonError("Locale invalide", 400);
  }
  const res = jsonSuccess();
  res.cookies.set("cfm_locale", locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  return res;
}
