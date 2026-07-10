import { NextRequest, NextResponse } from "next/server";
import { getCurrentMember } from "@/infrastructure/auth/member-auth";
import {
  getOpenHelpRequests,
  claimHelpRequest,
} from "@/infrastructure/repositories/entraide.repository";

export async function GET() {
  const member = await getCurrentMember();
  if (!member) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const missions = await getOpenHelpRequests();
  return NextResponse.json({ missions });
}

export async function POST(request: NextRequest) {
  const member = await getCurrentMember();
  if (!member) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const id =
    body && typeof body === "object" && "id" in body
      ? Number((body as { id: unknown }).id)
      : NaN;
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: "invalid_id" }, { status: 400 });
  }

  const volunteerName = `${member.first_name} ${member.last_name}`.trim();
  const ok = await claimHelpRequest(id, member.id, volunteerName);
  if (!ok) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
