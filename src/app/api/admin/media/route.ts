import { NextRequest } from "next/server";
import { getAdminAccess } from "@/lib/admin-access";
import { jsonData, jsonError, jsonSuccess, jsonUnauthorized } from "@/lib/api-response";
import { logAdminAction } from "@/lib/admin-audit";
import {
  getMediaState,
  patchMediaSettings,
  uploadMediaFile,
} from "@/application/services/media.service";
import { jsonUploadError } from "@/infrastructure/http/upload-response";

export const maxDuration = 120;

export async function GET() {
  if (!(await getAdminAccess())) return jsonUnauthorized();
  return jsonData(getMediaState());
}

export async function POST(request: NextRequest) {
  const access = await getAdminAccess();
  if (!access) return jsonUnauthorized();

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
        actorType: access,
        endpoint: "/api/admin/media",
        action: "upload",
        target: settingKey || result.path,
        status: "success",
        ip: request.headers.get("x-forwarded-for") || null,
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
      actorType: access,
      endpoint: "/api/admin/media",
      action: "upload",
      status: "error",
      ip: request.headers.get("x-forwarded-for") || null,
      metadata: {
        durationMs: Date.now() - started,
        message: err instanceof Error ? err.message : "unknown",
      },
    });
    return jsonUploadError(err);
  }
}

export async function PATCH(request: NextRequest) {
  const access = await getAdminAccess();
  if (!access) return jsonUnauthorized();

  try {
    const body = await request.json();

    if (body.action === "reset_hero") {
      patchMediaSettings({ action: "reset_hero" });
      await logAdminAction({
        actorType: access,
        endpoint: "/api/admin/media",
        action: "reset_hero",
        status: "success",
        ip: request.headers.get("x-forwarded-for") || null,
      });
      return jsonSuccess();
    }

    patchMediaSettings(body);

    await logAdminAction({
      actorType: access,
      endpoint: "/api/admin/media",
      action: "patch",
      status: "success",
      ip: request.headers.get("x-forwarded-for") || null,
    });
    return jsonData({ ok: true });
  } catch {
    return jsonError("Erreur mise à jour", 500);
  }
}
