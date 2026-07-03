export type PaymentProvider = "orange" | "mpesa" | "airtel";

export interface CreatePaymentInput {
  amount: number;
  currency: string;
  provider: PaymentProvider;
  phone: string;
  description: string;
  customData?: Record<string, string>;
}

export interface PaymentResult {
  token: string;
  redirectUrl: string;
}

export interface PaymentPort {
  createPayment(input: CreatePaymentInput): Promise<PaymentResult>;
  verifyWebhookSignature(payload: string, signature: string): boolean;
}
