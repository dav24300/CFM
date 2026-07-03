import { NextRequest } from "next/server";
import { getStore, updateStore } from "@/lib/store";
import { requireAdminAccess } from "@/lib/admin-rest";
import { jsonData, jsonError, jsonSuccess } from "@/lib/api-response";
import { logAdminAction } from "@/lib/admin-audit";

export async function GET() {
  const auth = await requireAdminAccess();
  if (!auth.ok) return auth.response;
  return jsonData({ settings: getStore().site_settings });
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAdminAccess();
  if (!auth.ok) return auth.response;

  const body = await request.json();
  const patch = body.settings as Record<string, string> | undefined;
  if (!patch || typeof patch !== "object") {
    return jsonError("settings requis", 400);
  }

  updateStore((store) => {
    store.site_settings = { ...store.site_settings, ...patch };
  });

  await logAdminAction({
    actorType: auth.access,
    endpoint: "/api/admin/settings",
    action: "patch",
    status: "success",
    ip: request.headers.get("x-forwarded-for"),
  });

  return jsonSuccess();
}
