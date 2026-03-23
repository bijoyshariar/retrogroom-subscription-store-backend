import { config } from "../config";

interface SmsResponse {
  error: number;
  msg: string;
  data?: {
    request_id: number;
  };
}

export const sendSms = async (to: string, message: string): Promise<SmsResponse> => {
  if (!config.alphaSmsApiKey) {
    throw new Error("Alpha SMS API key is not configured");
  }

  // Ensure number starts with 880
  let formattedNumber = to.replace(/\s+/g, "").replace(/^(\+)/, "");
  if (formattedNumber.startsWith("01")) {
    formattedNumber = "880" + formattedNumber;
  }

  const response = await fetch("https://api.sms.net.bd/sendsms", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      api_key: config.alphaSmsApiKey,
      msg: message,
      to: formattedNumber,
    }),
  });

  const data: SmsResponse = await response.json();

  if (data.error !== 0) {
    throw new Error(`SMS failed: ${data.msg} (error ${data.error})`);
  }

  return data;
};

export const getSmsBalance = async (): Promise<string> => {
  if (!config.alphaSmsApiKey) {
    throw new Error("Alpha SMS API key is not configured");
  }

  const response = await fetch(
    `https://api.sms.net.bd/user/balance/?api_key=${config.alphaSmsApiKey}`,
  );
  const data = await response.json();
  return data.data?.balance || "0";
};
