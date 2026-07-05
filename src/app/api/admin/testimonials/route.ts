import { NextRequest } from "next/server";
import { getAdminData } from "@/lib/db";
import { requireAdminRole } from "@/lib/admin-rest";
import { parseOrBadRequest } from "@/lib/validators";
import { adminTestimonialCreateSchema } from "@/lib/validators/admin-api";
import { jsonData } from "@/lib/api-response";
import { createContentItem } from "@/infrastructure/http/admin-content-handlers";

export async function GET() {
  const auth = await requireAdminRole();
  if (!auth.ok) return auth.response;
  const { testimonials } = await getAdminData();
  return jsonData({ testimonials });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminRole();
  if (!auth.ok) return auth.response;
  const parsed = parseOrBadRequest(adminTestimonialCreateSchema, await request.json());
  if (!parsed.ok) return parsed.response;
  const data = { ...parsed.data, anonymous: String(parsed.data.anonymous ?? 0) };
  return createContentItem("testimonials", data as Record<string, string>);
}
