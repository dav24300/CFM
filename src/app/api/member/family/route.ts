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
import { parseOrBadRequest } from "@/lib/validators";
import { memberFamilyActionSchema } from "@/lib/validators/public-api";

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

  const parsed = parseOrBadRequest(
    memberFamilyActionSchema,
    await request.json().catch(() => null),
    "Action inconnue"
  );
  if (!parsed.ok) return parsed.response;

  try {
    const result = await manageFamilyLink(userId, parsed.data);
    if (result) return jsonSuccess({ link: result });
    return jsonSuccess();
  } catch (err) {
    if (err instanceof Error && err.message === "UNKNOWN_ACTION") {
      return jsonError("Action inconnue", 400);
    }
    return handleDomainErrorOrFallback(err);
  }
}
