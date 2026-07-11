import { NextRequest } from "next/server";
import {
  getSiteSettings,
  patchSiteSettings,
} from "@/infrastructure/repositories/settings.repository";
import { invalidateSettingsPatch } from "@/infrastructure/persistence/admin-mutation";
import { requireAdminRole } from "@/lib/admin-rest";
import { jsonData, jsonError, jsonSuccess } from "@/lib/api-response";
import { logAdminAction } from "@/lib/admin-audit";

export async function GET() {
  const auth = await requireAdminRole();
  if (!auth.ok) return auth.response;
  return jsonData({ settings: await getSiteSettings() });
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAdminRole();
  if (!auth.ok) return auth.response;

  const body = await request.json();
  const patch = body.settings as Record<string, string> | undefined;
  if (!patch || typeof patch !== "object") {
    return jsonError("settings requis", 400);
  }

  await patchSiteSettings(patch);
  invalidateSettingsPatch(patch);

  await logAdminAction({
    actorType: auth.access,
    endpoint: "/api/admin/settings",
    action: "patch",
    status: "success",
    ip: request.headers.get("x-forwarded-for"),
  });

  return jsonSuccess();
}
