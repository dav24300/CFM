import { NextRequest } from "next/server";
import { loginMember } from "@/application/services/member.service";
import {
  handleDomainError,
  jsonError,
  jsonSuccess,
  jsonUnauthorized,
} from "@/infrastructure/http/api-response";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    if (!email || !password) {
      return jsonError("Champs requis", 400);
    }

    // Les statuts pending/suspended sont refusés par loginMember (403 domaine)
    // avant toute création de session.
    const user = await loginMember(email, password);
    if (!user) {
      return jsonUnauthorized("Email ou mot de passe incorrect");
    }

    return jsonSuccess({ user });
  } catch (err) {
    return handleDomainError(err);
  }
}
