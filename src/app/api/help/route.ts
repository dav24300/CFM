import { NextRequest } from "next/server";
import { submitHelpRequest } from "@/application/services/contact.service";
import { handleDomainError, jsonSuccess } from "@/infrastructure/http/api-response";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    await submitHelpRequest(body);
    return jsonSuccess();
  } catch (err) {
    return handleDomainError(err);
  }
}
