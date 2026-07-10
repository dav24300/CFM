import { NextRequest, NextResponse } from "next/server";
import { getCurrentMember } from "@/infrastructure/auth/member-auth";
import {
  getMessagesForUser,
  sendMemberMessage,
} from "@/infrastructure/repositories/messages.repository";

export async function GET() {
  const member = await getCurrentMember();
  if (!member) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const messages = await getMessagesForUser(member.id);
  return NextResponse.json({ messages });
}

export async function POST(request: NextRequest) {
  const member = await getCurrentMember();
  if (!member) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: { subject?: string; body?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const text = typeof body.body === "string" ? body.body.trim() : "";
  if (!text) {
    return NextResponse.json({ error: "body_required" }, { status: 400 });
  }

  await sendMemberMessage(member.id, {
    subject: typeof body.subject === "string" ? body.subject : undefined,
    body: text,
  });
  return NextResponse.json({ ok: true });
}
