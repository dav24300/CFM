import { NextRequest } from "next/server";
import { getCurrentMember } from "@/infrastructure/auth/member-auth";
import {
  getOpenHelpRequests,
  claimHelpRequest,
} from "@/infrastructure/repositories/entraide.repository";
import {
  jsonData,
  jsonError,
  jsonForbidden,
  jsonNotFound,
  jsonSuccess,
  jsonUnauthorized,
} from "@/infrastructure/http/api-response";

function canHandleMissions(role: string | null | undefined): boolean {
  return role === "volunteer" || role === "coordinator";
}

export async function GET() {
  const member = await getCurrentMember();
  if (!member) return jsonUnauthorized();
  if (!canHandleMissions(member.role)) return jsonForbidden();
  const missions = await getOpenHelpRequests();
  return jsonData({ missions });
}

export async function POST(request: NextRequest) {
  const member = await getCurrentMember();
  if (!member) return jsonUnauthorized();
  if (!canHandleMissions(member.role)) return jsonForbidden();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Champs invalides", 400);
  }

  const id =
    body && typeof body === "object" && "id" in body
      ? Number((body as { id: unknown }).id)
      : NaN;
  if (!Number.isFinite(id)) {
    return jsonError("Identifiant invalide", 400);
  }

  const volunteerName = `${member.first_name} ${member.last_name}`.trim();
  const ok = await claimHelpRequest(id, member.id, volunteerName);
  if (!ok) return jsonNotFound("Mission introuvable");
  return jsonSuccess();
}
