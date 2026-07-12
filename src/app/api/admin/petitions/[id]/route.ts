import { NextRequest } from "next/server";
import {
  deletePetition,
  getPetitionById,
  updatePetition,
} from "@/lib/members";
import { jsonData, jsonNotFound, jsonSuccess } from "@/lib/api-response";
import { requireAdminAccess } from "@/lib/admin-rest";
import { parseOrBadRequest } from "@/lib/validators";
import { adminPetitionPatchSchema } from "@/lib/validators/admin-api";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminAccess();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const petitionId = parseInt(id, 10);
  if (!Number.isFinite(petitionId)) return jsonNotFound("Pétition introuvable");
  const petition = await getPetitionById(petitionId);
  if (!petition) return jsonNotFound("Pétition introuvable");
  return jsonData({ petition });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminAccess();
  if (!auth.ok) return auth.response;

  const body = await request.json();
  const parsed = parseOrBadRequest(adminPetitionPatchSchema, body);
  if (!parsed.ok) return parsed.response;

  const { id } = await params;
  const petitionId = parseInt(id, 10);
  if (!Number.isFinite(petitionId)) return jsonNotFound("Pétition introuvable");
  const ok = await updatePetition(petitionId, parsed.data);
  if (!ok) return jsonNotFound("Pétition introuvable");
  return jsonSuccess();
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminAccess();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const petitionId = parseInt(id, 10);
  if (!Number.isFinite(petitionId)) return jsonNotFound("Pétition introuvable");
  const ok = await deletePetition(petitionId);
  if (!ok) return jsonNotFound("Pétition introuvable");
  return jsonSuccess();
}
