import { NextRequest } from "next/server";
import { adminCreate, adminDelete, adminUpdateContent } from "@/infrastructure/repositories/content.repository";
import { getAdminData } from "@/lib/db";
import { jsonData, jsonError, jsonNotFound, jsonSuccess } from "@/lib/api-response";
import type { z } from "zod";

export type ContentTable =
  | "news"
  | "studies"
  | "campaigns"
  | "press_releases"
  | "testimonials";

export async function getContentItem(table: ContentTable, id: number) {
  const data = await getAdminData();
  const items = data[table as keyof typeof data];
  if (!Array.isArray(items)) return null;
  return (items as { id: number }[]).find((i) => i.id === id) ?? null;
}

export async function patchContentItem(
  table: ContentTable,
  id: number,
  patch: Record<string, string | number | null>
) {
  const ok = await adminUpdateContent(table, id, patch);
  if (!ok) return jsonNotFound("Élément introuvable");
  return jsonSuccess();
}

export async function deleteContentItem(table: ContentTable, id: number) {
  try {
    await adminDelete(table, id);
    return jsonSuccess();
  } catch {
    return jsonError("Erreur serveur", 500);
  }
}

export async function createContentItem(
  table: ContentTable,
  data: Record<string, string>
) {
  try {
    await adminCreate(table, data);
    return jsonSuccess();
  } catch {
    return jsonError("Erreur serveur", 500);
  }
}

export function parseContentId(id: string): number | null {
  const n = parseInt(id, 10);
  return Number.isFinite(n) ? n : null;
}

export function applyZodPatch<T extends z.ZodType>(
  parsed: z.infer<T>
): Record<string, string | number | null> {
  const out: Record<string, string | number | null> = {};
  for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
    if (v !== undefined) out[k] = v as string | number | null;
  }
  return out;
}
