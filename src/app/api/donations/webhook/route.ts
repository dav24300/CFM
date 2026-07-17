import { NextRequest } from "next/server";
import { handleDonationWebhook } from "@/application/services/donation.service";
import { getMobileMoneyMode } from "@/infrastructure/payment/payment-mode";
import { jsonData, jsonError, jsonUnauthorized } from "@/infrastructure/http/api-response";

export async function POST(request: NextRequest) {
  try {
    const masterKey = process.env.PAYDUNYA_MASTER_KEY;
    const isProd = getMobileMoneyMode() === "production";
    const receivedHash =
      request.headers.get("PAYDUNYA-SIGNATURE") ||
      request.headers.get("paydunya-signature") ||
      "";

    const rawBody = await request.text();
    const body = JSON.parse(rawBody) as {
      status?: string;
      data?: {
        custom_data?: { donation_id?: string };
        invoice?: { token?: string };
        hash?: string;
      };
    };

    if (masterKey) {
      if (!receivedHash) {
        if (isProd) {
          return jsonUnauthorized("Signature manquante");
        }
      } else {
        const { verifyPayDunyaWebhookHash } = await import(
          "@/infrastructure/payment/paydunya.adapter"
        );
        if (!verifyPayDunyaWebhookHash(receivedHash, masterKey, rawBody)) {
          return jsonUnauthorized("Signature invalide");
        }
      }
    } else if (isProd) {
      return jsonError("Configuration paiement manquante", 500);
    }

    const { data } = body;

    if (body.status !== "completed" || !data?.custom_data?.donation_id) {
      return jsonData({ received: true });
    }

    const donationId = parseInt(data.custom_data.donation_id, 10);
    const transactionId = data.invoice?.token || data.hash || `PD-${Date.now()}`;

    await handleDonationWebhook(donationId, transactionId);

    return jsonData({ received: true });
  } catch {
    return jsonError("Webhook error", 500);
  }
}
