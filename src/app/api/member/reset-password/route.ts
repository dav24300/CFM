import { NextRequest } from "next/server";
import { resetPassword } from "@/application/services/member.service";
import { handleDomainErrorOrFallback, jsonError, jsonSuccess } from "@/lib/api-response";

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json();
    if (!token || !password) {
      return jsonError("Champs requis", 400);
    }

    await resetPassword(token, password);
    return jsonSuccess();
  } catch (err) {
    return handleDomainErrorOrFallback(err, "Erreur");
  }
}
