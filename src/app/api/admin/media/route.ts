import { NextRequest } from "next/server";
import fs from "fs";
import path from "path";
import { getAdminAccess } from "@/lib/admin-access";
import { getStore, updateStore } from "@/lib/store";
import {
  jsonData,
  jsonError,
  jsonForbidden,
  jsonUnauthorized,
} from "@/lib/api-response";
import { logAdminAction } from "@/lib/admin-audit";

const UPLOAD_DIR = path.join(process.cwd(), "public", "media", "uploads");
const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/svg+xml",
  "video/mp4",
  "video/webm",
]);

export async function GET() {
  if (!(await getAdminAccess())) {
    return jsonUnauthorized();
  }
  const settings = getStore().site_settings;
  return jsonData({
    hero_image: settings.hero_image || "",
    hero_poster: settings.hero_poster || "",
    hero_video: settings.hero_video || "",
    mission_image: settings.mission_image || "",
  });
}

export async function POST(request: NextRequest) {
  const access = await getAdminAccess();
  if (!access) {
    await logAdminAction({
      actorType: "unknown",
      endpoint: "/api/admin/media",
      action: "upload",
      status: "denied",
      ip: request.headers.get("x-forwarded-for") || null,
    });
    return jsonUnauthorized();
  }

  try {
    const form = await request.formData();
    const file = form.get("file") as File | null;
    const settingKey = form.get("settingKey") as string | null;

    if (!file) {
      return jsonError("Fichier requis", 400);
    }

    if (!ALLOWED.has(file.type)) {
      return jsonError("Type de fichier non autorisé", 400);
    }

    if (file.size > MAX_SIZE) {
      return jsonError("Fichier trop volumineux (max 5 Mo)", 400);
    }

    fs.mkdirSync(UPLOAD_DIR, { recursive: true });

    const ext = file.name.split(".").pop()?.toLowerCase() || "webp";
    const safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(path.join(UPLOAD_DIR, safeName), buffer);

    const publicPath = `/media/uploads/${safeName}`;

    if (settingKey) {
      const allowedKeys = ["hero_image", "hero_poster", "hero_video", "mission_image"];
      if (!allowedKeys.includes(settingKey)) {
        return jsonError("Clé setting invalide", 400);
      }
      updateStore((store) => {
        store.site_settings[settingKey] = publicPath;
      });
    }

    await logAdminAction({
      actorType: access,
      endpoint: "/api/admin/media",
      action: "upload",
      target: settingKey || publicPath,
      status: "success",
      ip: request.headers.get("x-forwarded-for") || null,
    });
    return jsonData({ path: publicPath, settingKey });
  } catch {
    return jsonError("Erreur upload", 500);
  }
}

export async function PATCH(request: NextRequest) {
  const access = await getAdminAccess();
  if (!access) {
    return jsonUnauthorized();
  }

  try {
    const body = await request.json();
    const allowedKeys = ["hero_image", "hero_poster", "hero_video", "mission_image"];
    updateStore((store) => {
      for (const key of allowedKeys) {
        if (typeof body[key] === "string") {
          store.site_settings[key] = body[key];
        }
      }
    });
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
