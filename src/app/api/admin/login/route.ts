import { NextRequest } from "next/server";
import { adminLogin } from "@/application/services/auth.service";
import { jsonError, jsonSuccess, jsonUnauthorized } from "@/lib/api-response";

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();
    const ok = await adminLogin(
      password,
      request.headers.get("x-forwarded-for")
    );
    if (!ok) {
      return jsonUnauthorized("Mot de passe incorrect");
    }
    return jsonSuccess();
  } catch {
    return jsonError("Erreur serveur", 500);
  }
}
