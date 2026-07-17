import { SITE } from "@/lib/constants";
import { createHmac, timingSafeEqual } from "crypto";
import { domainError } from "@/domain/errors/domain-error";
import { getMobileMoneyMode } from "@/infrastructure/payment/payment-mode";

const PAYDUNYA_LIVE_API = "https://app.paydunya.com/api/v1";
const PAYDUNYA_SANDBOX_API = "https://app.paydunya.com/sandbox-api/v1";

// PAYDUNYA_API_BASE prime sur le mode (utile pour pointer un simulateur local).
export function getPayDunyaApiBase(): string {
  const override = process.env.PAYDUNYA_API_BASE?.trim();
  if (override) return override.replace(/\/+$/, "");
  return getMobileMoneyMode() === "sandbox" ? PAYDUNYA_SANDBOX_API : PAYDUNYA_LIVE_API;
}

type CreateInvoiceParams = {
  amount: number;
  currency: string;
  description: string;
  donationId: number;
  cancelUrl?: string;
  returnUrl?: string;
};

type PayDunyaResult = {
  success: boolean;
  token?: string;
  invoice_url?: string;
  response?: unknown;
  error?: string;
};

function getHeaders() {
  const master = process.env.PAYDUNYA_MASTER_KEY;
  const privateKey = process.env.PAYDUNYA_PRIVATE_KEY;
  const token = process.env.PAYDUNYA_TOKEN;
  if (!master || !privateKey || !token) {
    throw domainError("PAYDUNYA_KEYS_MISSING");
  }
  return {
    "Content-Type": "application/json",
    "PAYDUNYA-MASTER-KEY": master,
    "PAYDUNYA-PRIVATE-KEY": privateKey,
    "PAYDUNYA-TOKEN": token,
  };
}

export async function createPayDunyaInvoice(
  params: CreateInvoiceParams
): Promise<PayDunyaResult> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  const body = {
    invoice: {
      items: [
        {
          name: params.description,
          quantity: 1,
          unit_price: params.amount,
          total_price: params.amount,
          description: `Don CFM #${params.donationId}`,
        },
      ],
      total_amount: params.amount,
      description: params.description,
    },
    store: {
      name: SITE.sigle,
    },
    custom_data: {
      donation_id: params.donationId,
    },
    actions: {
      cancel_url: params.cancelUrl || `${baseUrl}/s-engager#don`,
      return_url: params.returnUrl || `${baseUrl}/s-engager?don=success`,
      callback_url: `${baseUrl}/api/donations/webhook`,
    },
  };

  try {
    const res = await fetch(`${getPayDunyaApiBase()}/checkout-invoice/create`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(body),
    });
    const data = await res.json();

    if (data.response_code === "00" && data.response_text) {
      return {
        success: true,
        token: data.token,
        invoice_url: data.response_text,
        response: data,
      };
    }

    return {
      success: false,
      error: data.response_text || "Erreur PayDunya",
      response: data,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Erreur réseau PayDunya",
    };
  }
}

export function verifyPayDunyaWebhookHash(
  receivedHash: string,
  masterKey: string,
  rawBody?: string
): boolean {
  const normalized = receivedHash.trim();
  if (!normalized) return false;

  // Backward-compatible fallback (demo/sandbox only, jamais en production).
  if (getMobileMoneyMode() !== "production" && normalized === masterKey) {
    return true;
  }

  if (!rawBody) return false;
  const secret = process.env.PAYDUNYA_WEBHOOK_SECRET || masterKey;
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  try {
    return timingSafeEqual(Buffer.from(normalized), Buffer.from(expected));
  } catch {
    return false;
  }
}
