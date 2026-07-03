import { NextRequest } from "next/server";
import { registerMember } from "@/application/services/member.service";
import { handleDomainErrorOrFallback, jsonSuccess } from "@/lib/api-response";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await registerMember(body);
    return jsonSuccess(result);
  } catch (err) {
    return handleDomainErrorOrFallback(err, "Erreur");
  }
}
