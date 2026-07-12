import { NextRequest } from "next/server";
import fs from "fs";
import path from "path";
import {
  getSiteSetting,
  patchSiteSettings,
} from "@/infrastructure/repositories/settings.repository";
import { invalidateI18nCache } from "@/infrastructure/cache/invalidate-i18n";
import { requireAdminAccess } from "@/lib/admin-rest";
import { getClientIp } from "@/lib/rate-limit";
import { jsonData, jsonError, jsonSuccess } from "@/lib/api-response";
import { logAdminAction } from "@/lib/admin-audit";

const LOCALES = ["fr", "en", "ln", "sw"] as const;
const MESSAGES_DIR = path.join(process.cwd(), "src", "lib", "i18n", "messages");

function loadBaseMessages(locale: string): Record<string, unknown> {
  const file = path.join(MESSAGES_DIR, `${locale}.json`);
  if (!fs.existsSync(file)) return {};
  return JSON.parse(fs.readFileSync(file, "utf-8")) as Record<string, unknown>;
}

export async function GET() {
  const auth = await requireAdminAccess();
  if (!auth.ok) return auth.response;

  const overridesRaw = await getSiteSetting("i18n_overrides");
  const overrides = overridesRaw ? (JSON.parse(overridesRaw) as Record<string, Record<string, string>>) : {};

  const base: Record<string, Record<string, unknown>> = {};
  for (const locale of LOCALES) {
    base[locale] = loadBaseMessages(locale);
  }

  return jsonData({ locales: LOCALES, base, overrides });
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAdminAccess();
  if (!auth.ok) return auth.response;

  const body = await request.json();
  const { locale, key, value } = body as { locale?: string; key?: string; value?: string };
  if (!locale || !key || value === undefined) {
    return jsonError("locale, key et value requis", 400);
  }

  const raw = await getSiteSetting("i18n_overrides");
  const overrides = raw ? (JSON.parse(raw) as Record<string, Record<string, string>>) : {};
  if (!overrides[locale]) overrides[locale] = {};
  overrides[locale][key] = value;
  await patchSiteSettings({ i18n_overrides: JSON.stringify(overrides) });
  invalidateI18nCache();

  await logAdminAction({
    actorType: auth.access,
    endpoint: "/api/admin/i18n",
    action: "patch",
    target: `${locale}:${key}`,
    status: "success",
    ip: getClientIp(request),
  });

  return jsonSuccess();
}
