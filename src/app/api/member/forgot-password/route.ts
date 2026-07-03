import { NextRequest } from "next/server";
import { requestPasswordReset } from "@/application/services/member.service";
import { handleDomainError, jsonError, jsonSuccess } from "@/lib/api-response";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    if (!email) {
      return jsonError("Email requis", 400);
    }

    await requestPasswordReset(email);

    return jsonSuccess({
      message: "Si cet email existe, un lien de réinitialisation a été envoyé.",
    });
  } catch (err) {
    return handleDomainError(err);
  }
}
