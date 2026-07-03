import { NextRequest } from "next/server";
import { getLiveEventBySlug, getPollsForEvent, createLivePoll } from "@/lib/live";
import { getAdminAccess } from "@/lib/admin-access";
import { jsonData, jsonError, jsonNotFound, jsonUnauthorized } from "@/lib/api-response";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const event = getLiveEventBySlug(slug);
  if (!event) {
    return jsonNotFound("Introuvable");
  }
  return jsonData({ polls: getPollsForEvent(event.id) });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  if (!(await getAdminAccess())) {
    return jsonUnauthorized();
  }

  const { slug } = await params;
  const event = getLiveEventBySlug(slug);
  if (!event) {
    return jsonNotFound("Introuvable");
  }

  const { question, options } = await request.json();
  if (!question || !Array.isArray(options) || options.length < 2) {
    return jsonError("Question et 2+ options requis", 400);
  }

  const poll = createLivePoll(event.id, question, options);
  return jsonData({ poll });
}
