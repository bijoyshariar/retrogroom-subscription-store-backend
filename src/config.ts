require("dotenv").config();

const _config = {
  port: process.env.PORT,
  databaseUrl: process.env.MONGO_CONNECTION_STRING,
  env: process.env.NODE_ENV,
  jwtSecret: process.env.JWT_SECRET,
  root: process.env.ROOT,
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:3000",
  // SSLCommerz
  storeId: process.env.STORE_ID,
  storeSecret: process.env.STORE_PASSWORD,
  // UddoktaPay
  uddoktapayApiKey: process.env.UDDOKTAPAY_API_KEY,
  uddoktapayBaseUrl: process.env.UDDOKTAPAY_BASE_URL,
  // Alpha SMS (sms.net.bd)
  alphaSmsApiKey: process.env.ALPHA_SMS_API_KEY,
};

export const config = Object.freeze(_config);
