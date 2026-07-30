import { NextRequest } from "next/server";
import {
  getMemberDashboard,
  getCurrentMember,
  updateProfile,
} from "@/application/services/member.service";
import {
  handleDomainError,
  jsonData,
  jsonError,
  jsonUnauthorized,
} from "@/infrastructure/http/api-response";

export async function GET() {
  const data = await getMemberDashboard();
  if (!data) return jsonUnauthorized("Non connecté");
  return jsonData(data);
}

/**
 * Mise à jour du profil par le membre. Jusqu'ici le formulaire PATCHait cet
 * endpoint qui n'exposait que GET (405 silencieux) — la modification de profil
 * était donc inopérante. L'email devient éditable : c'est la seule voie par
 * laquelle un membre inscrit par téléphone peut un jour redevenir autonome pour
 * sa récupération.
 */
export async function PATCH(request: NextRequest) {
  try {
    const member = await getCurrentMember();
    if (!member) return jsonUnauthorized("Non connecté");
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const updated = await updateProfile(member.id, {
      first_name: typeof body.first_name === "string" ? body.first_name : undefined,
      last_name: typeof body.last_name === "string" ? body.last_name : undefined,
      phone: typeof body.phone === "string" ? body.phone : undefined,
      province: typeof body.province === "string" ? body.province : undefined,
      email: typeof body.email === "string" ? body.email : undefined,
    });
    if (!updated) return jsonError("Compte introuvable", 404);
    return jsonData(updated);
  } catch (err) {
    return handleDomainError(err);
  }
}
