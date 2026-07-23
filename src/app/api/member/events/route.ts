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
  // `viewerId` : chaque membre reçoit son propre état d'inscription, sans que
  // la liste des autres inscrits ne quitte la base.
  const events = await getUpcomingEvents(member.id);
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

  const result = await rsvpEvent(eventId, member.id);
  if (!result) return jsonNotFound("Événement introuvable");

  // On ne renvoie plus l'événement complet : il portait `rsvp_user_ids`, donc
  // les identifiants des autres membres.
  if (result.full) {
    return jsonError("Événement complet", 409);
  }
  return jsonData({ going: result.going, count: result.count });
}
