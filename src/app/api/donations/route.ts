import { NextRequest } from "next/server";
import { processDonation } from "@/application/services/donation.service";
import { handleDomainError, jsonError, jsonSuccess } from "@/lib/api-response";
import { parseOrBadRequest } from "@/lib/validators";
import { donationCreateSchema } from "@/lib/validators/public-api";

export async function POST(request: NextRequest) {
  const parsed = parseOrBadRequest(
    donationCreateSchema,
    await request.json().catch(() => null),
    "Champs invalides"
  );
  if (!parsed.ok) return parsed.response;

  try {
    // null ⇒ undefined : le service applique déjà ses fallbacks (`|| "USD"`,
    // `|| member?.email`) sur toute valeur falsy — comportement identique.
    const result = await processDonation({
      ...parsed.data,
      currency: parsed.data.currency ?? undefined,
      donor_name: parsed.data.donor_name ?? undefined,
      donor_email: parsed.data.donor_email ?? undefined,
    });

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
