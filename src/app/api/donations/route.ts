import { NextRequest } from "next/server";
import { processDonation } from "@/application/services/donation.service";
import { handleDomainError, jsonError, jsonSuccess } from "@/lib/api-response";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amount, provider, phone } = body;

    if (!amount || amount < 1 || !provider || !phone) {
      return jsonError("Champs invalides", 400);
    }

    const result = await processDonation(body);

    if (result.mode === "demo") {
      return jsonSuccess({
        donation: result.donation,
        mode: result.mode,
        message: result.message,
      });
    }

    return jsonSuccess({
      donation: result.donation,
      paymentUrl: result.paymentUrl,
      mode: result.mode,
    });
  } catch (err) {
    if (err instanceof Error && err.message === "PAYDUNYA_ERROR") {
      return jsonError("Erreur PayDunya", 502);
    }
    return handleDomainError(err);
  }
}
