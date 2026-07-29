import { NextRequest } from "next/server";
import { changePassword, getCurrentMember } from "@/application/services/member.service";
import {
  handleDomainError,
  jsonError,
  jsonSuccess,
  jsonUnauthorized,
} from "@/infrastructure/http/api-response";

/**
 * Changement de mot de passe en libre-service (mot de passe actuel + nouveau).
 * Rend réellement provisoire le mot de passe délivré par un responsable — sans
 * cette route, les mots de passe remis en main propre resteraient permanents et
 * connus du bureau. Le changement révoque les sessions antérieures
 * (password_changed_at).
 */
export async function POST(request: NextRequest) {
  try {
    const member = await getCurrentMember();
    if (!member) return jsonUnauthorized("Non connecté");
    const { current_password, new_password } = await request.json();
    if (!current_password || !new_password) return jsonError("Champs requis", 400);
    await changePassword(member.id, current_password, new_password);
    return jsonSuccess();
  } catch (err) {
    return handleDomainError(err);
  }
}
