import { NextRequest } from "next/server";
import { getLiveEventBySlug, getPollsForEvent, createLivePoll } from "@/infrastructure/repositories/live.repository";
import { requireAdminAccess } from "@/lib/admin-rest";
import { jsonData, jsonError, jsonNotFound } from "@/infrastructure/http/api-response";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const event = await getLiveEventBySlug(slug);
  if (!event) {
    return jsonNotFound("Introuvable");
  }
  return jsonData({ polls: await getPollsForEvent(event.id) });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const auth = await requireAdminAccess();
  if (!auth.ok) return auth.response;

  const { slug } = await params;
  const event = await getLiveEventBySlug(slug);
  if (!event) {
    return jsonNotFound("Introuvable");
  }

  const { question, options } = await request.json();
  if (!question || !Array.isArray(options) || options.length < 2) {
    return jsonError("Question et 2+ options requis", 400);
  }

  const poll = await createLivePoll(event.id, question, options);
  return jsonData({ poll });
}
