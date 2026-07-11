import { NextRequest } from "next/server";
import { getStoreAsync } from "@/lib/store";
import { updateStoreAsync } from "@/infrastructure/persistence/store-access";
import { invalidateSettingsPatch } from "@/infrastructure/persistence/admin-mutation";
import { requireAdminRole } from "@/lib/admin-rest";
import { jsonData, jsonError, jsonSuccess } from "@/lib/api-response";
import { logAdminAction } from "@/lib/admin-audit";

export async function GET() {
  const auth = await requireAdminRole();
  if (!auth.ok) return auth.response;
  const store = await getStoreAsync();
  return jsonData({ settings: store.site_settings });
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAdminRole();
  if (!auth.ok) return auth.response;

  const body = await request.json();
  const patch = body.settings as Record<string, string> | undefined;
  if (!patch || typeof patch !== "object") {
    return jsonError("settings requis", 400);
  }

  await updateStoreAsync((store) => {
    store.site_settings = { ...store.site_settings, ...patch };
  });
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
