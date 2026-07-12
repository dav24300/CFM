import { NextRequest } from "next/server";
import { getCurrentMember } from "@/infrastructure/auth/member-auth";
import {
  getUpcomingEvents,
  rsvpEvent,
} from "@/infrastructure/repositories/events.repository";
import {
  jsonData,
  jsonError,
  jsonNotFound,
  jsonUnauthorized,
} from "@/infrastructure/http/api-response";

export async function GET() {
  const member = await getCurrentMember();
  if (!member) return jsonUnauthorized();
  const events = await getUpcomingEvents();
  return jsonData({ events });
}

export async function POST(request: NextRequest) {
  const member = await getCurrentMember();
  if (!member) return jsonUnauthorized();

  let body: { eventId?: unknown };
  try {
    body = await request.json();
  } catch {
    return jsonError("Champs invalides", 400);
  }

  const eventId =
    typeof body.eventId === "number" ? body.eventId : Number(body.eventId);
  if (!Number.isFinite(eventId)) {
    return jsonError("Événement invalide", 400);
  }

  const event = await rsvpEvent(eventId, member.id);
  if (!event) return jsonNotFound("Événement introuvable");

  const going = event.rsvp_user_ids.includes(member.id);
  return jsonData({ event, going });
}
