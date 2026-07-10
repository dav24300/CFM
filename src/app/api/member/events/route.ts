import { NextRequest, NextResponse } from "next/server";
import { getCurrentMember } from "@/infrastructure/auth/member-auth";
import {
  getUpcomingEvents,
  rsvpEvent,
} from "@/infrastructure/repositories/events.repository";

export async function GET() {
  const member = await getCurrentMember();
  if (!member) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const events = await getUpcomingEvents();
  return NextResponse.json({ events });
}

export async function POST(request: NextRequest) {
  const member = await getCurrentMember();
  if (!member) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: { eventId?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const eventId =
    typeof body.eventId === "number"
      ? body.eventId
      : Number(body.eventId);
  if (!Number.isFinite(eventId)) {
    return NextResponse.json({ error: "invalid_event" }, { status: 400 });
  }

  const event = await rsvpEvent(eventId, member.id);
  if (!event) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const going = event.rsvp_user_ids.includes(member.id);
  return NextResponse.json({ event, going });
}
