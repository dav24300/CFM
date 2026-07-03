import { NextRequest } from "next/server";
import {
  getFamilyLinks,
  manageFamilyLink,
  getMemberSessionUserId,
  getCurrentMember,
} from "@/application/services/member.service";
import {
  handleDomainErrorOrFallback,
  jsonData,
  jsonError,
  jsonForbidden,
  jsonSuccess,
  jsonUnauthorized,
} from "@/lib/api-response";

export async function GET() {
  const user = await getCurrentMember();
  if (!user) return jsonUnauthorized("Non connecté");
  const links = await getFamilyLinks();
  return jsonData({ links });
}

export async function POST(request: NextRequest) {
  const userId = await getMemberSessionUserId();
  if (!userId) return jsonUnauthorized("Non connecté");

  const user = await getCurrentMember();
  if (!user || user.status !== "active") {
    return jsonForbidden("Compte non actif");
  }

  try {
    const body = await request.json();
    const result = await manageFamilyLink(userId, body);
    if (result) return jsonSuccess({ link: result });
    return jsonSuccess();
  } catch (err) {
    if (err instanceof Error && err.message === "UNKNOWN_ACTION") {
      return jsonError("Action inconnue", 400);
    }
    return handleDomainErrorOrFallback(err);
  }
}
