import { NextRequest } from "next/server";
import { requireAdminAccess } from "@/lib/admin-rest";
import { jsonData, jsonError, jsonSuccess } from "@/infrastructure/http/api-response";
import { logAdminAction } from "@/lib/admin-audit";
import { getClientIp } from "@/infrastructure/rate-limit/memory";
import {
  getMediaState,
  patchMediaSettings,
  uploadMediaFile,
} from "@/application/services/media.service";
import { jsonUploadError } from "@/infrastructure/http/upload-response";

export const maxDuration = 120;

export async function GET() {
  const auth = await requireAdminAccess();
  if (!auth.ok) return auth.response;
  return jsonData(getMediaState());
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminAccess();
  if (!auth.ok) return auth.response;

  const started = Date.now();

  try {
    const form = await request.formData();
    const file = form.get("file") as File | null;
    const settingKey = form.get("settingKey") as string | null;
    const category = (form.get("category") as string) || "upload";
    const subdir = form.get("subdir") as string | null;

    if (!file) return jsonError("Fichier requis", 400);

    const result = await uploadMediaFile({
      file,
      settingKey,
      category,
      subdir,
      alt: (form.get("alt") as string) || null,
    });

    try {
      await logAdminAction({
        actorType: auth.access,
        endpoint: "/api/admin/media",
        action: "upload",
        target: settingKey || result.path,
        status: "success",
        ip: getClientIp(request),
        metadata: {
          mime: file.type,
          size: file.size,
          durationMs: Date.now() - started,
          published: result.published,
          warnings: result.warnings,
        },
      });
    } catch (auditErr) {
      console.warn("[CFM] admin audit after upload:", auditErr);
    }

    return jsonData(result);
  } catch (err) {
    await logAdminAction({
      actorType: auth.access,
      endpoint: "/api/admin/media",
      action: "upload",
      status: "error",
      ip: getClientIp(request),
      metadata: {
        durationMs: Date.now() - started,
        message: err instanceof Error ? err.message : "unknown",
      },
    });
    return jsonUploadError(err);
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAdminAccess();
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json();

    if (body.action === "reset_hero") {
      patchMediaSettings({ action: "reset_hero" });
      await logAdminAction({
        actorType: auth.access,
        endpoint: "/api/admin/media",
        action: "reset_hero",
        status: "success",
        ip: getClientIp(request),
      });
      return jsonSuccess();
    }

    patchMediaSettings(body);

    await logAdminAction({
      actorType: auth.access,
      endpoint: "/api/admin/media",
      action: "patch",
      status: "success",
      ip: getClientIp(request),
    });
    return jsonSuccess();
  } catch {
    return jsonError("Erreur mise à jour", 500);
  }
}
