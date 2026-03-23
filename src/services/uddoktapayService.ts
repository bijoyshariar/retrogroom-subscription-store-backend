import { config } from "../config";

const BASE_URL = config.uddoktapayBaseUrl || "https://sandbox.uddoktapay.com";

const headers = () => ({
  "Content-Type": "application/json",
  Accept: "application/json",
  "RT-UDDOKTAPAY-API-KEY": config.uddoktapayApiKey || "",
});

interface CheckoutParams {
  fullName: string;
  email: string;
  amount: number;
  metadata: Record<string, string>;
  redirectUrl: string;
  cancelUrl: string;
  webhookUrl?: string;
}

interface VerifyResponse {
  full_name: string;
  email: string;
  amount: string;
  fee: string;
  charged_amount: string;
  invoice_id: string;
  metadata: Record<string, string>;
  payment_method: string;
  sender_number: string;
  transaction_id: string;
  date: string;
  status: "COMPLETED" | "PENDING" | "ERROR";
}

// Create a payment checkout
export const createCheckout = async (params: CheckoutParams): Promise<string> => {
  const response = await fetch(`${BASE_URL}/api/checkout-v2`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      full_name: params.fullName,
      email: params.email,
      amount: params.amount.toString(),
      metadata: params.metadata,
      redirect_url: params.redirectUrl,
      return_type: "GET",
      cancel_url: params.cancelUrl,
      webhook_url: params.webhookUrl || "",
    }),
  });

  const data = await response.json();

  if (!response.ok || !data.payment_url) {
    throw new Error(data.message || "Failed to create UddoktaPay checkout");
  }

  return data.payment_url;
};

// Verify a payment by invoice_id
export const verifyPayment = async (invoiceId: string): Promise<VerifyResponse> => {
  const response = await fetch(`${BASE_URL}/api/verify-payment`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ invoice_id: invoiceId }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to verify payment");
  }

  return data as VerifyResponse;
};

// Validate webhook request (check API key header)
export const validateWebhook = (headerApiKey: string): boolean => {
  return headerApiKey === config.uddoktapayApiKey;
};
