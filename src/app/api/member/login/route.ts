import { NextRequest } from "next/server";
import { loginMember } from "@/application/services/member.service";
import {
  handleDomainError,
  jsonError,
  jsonForbidden,
  jsonSuccess,
  jsonUnauthorized,
} from "@/infrastructure/http/api-response";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    if (!email || !password) {
      return jsonError("Champs requis", 400);
    }

    const user = await loginMember(email, password);
    if (!user) {
      return jsonUnauthorized("Email ou mot de passe incorrect");
    }

    if (user.status === "suspended") {
      return jsonForbidden("Compte suspendu");
    }

    return jsonSuccess({ user });
  } catch (err) {
    return handleDomainError(err);
  }
}
