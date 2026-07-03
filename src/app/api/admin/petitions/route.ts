import { NextRequest } from "next/server";
import { createPetition, getActivePetitions } from "@/lib/members";
import { jsonData, jsonError, jsonSuccess } from "@/lib/api-response";
import { requireAdminRole } from "@/lib/admin-rest";
import { parseOrBadRequest } from "@/lib/validators";
import { adminPetitionCreateSchema } from "@/lib/validators/admin-api";

export async function GET() {
  const auth = await requireAdminRole();
  if (!auth.ok) return auth.response;
  return jsonData({ petitions: getActivePetitions() });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminRole();
  if (!auth.ok) return auth.response;

  const body = await request.json();
  const parsed = parseOrBadRequest(adminPetitionCreateSchema, body);
  if (!parsed.ok) return parsed.response;

  try {
    const petition = createPetition(parsed.data);
    return jsonSuccess({ petition });
  } catch {
    return jsonError("Erreur serveur", 500);
  }
}
