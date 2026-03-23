import express from "express";
import path from "path";
import {config} from "./src/config";
import connectDb from "./src/dbConnection";
import globalErrorHAndler from "./src/middlewares/globalErrorHandler";
import userRouter from "./services/user/userRouter";
import productRouter from "./services/product/productRouter";
import orderRouter from "./services/order/orderRouter";
import collectionRouter from "./services/collection/collectionRouter";
import couponRouter from "./services/coupon/couponRouter";
import ticketRouter from "./services/ticket/ticketRouter";
import refundRouter from "./services/refund/refundRouter";

const app = express();
const Port = config.port || 4001;
app.use(express.json());
app.use((req, res, next) => {
  const allowedOrigins = [config.frontendUrl, 'http://localhost:3000'];
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

//MongoDB connection
connectDb();

// Serve uploaded images as static files
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// Health check (for UptimeRobot / cron pings to prevent cold starts)
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

// Routes
app.use("/api/user", userRouter);
app.use("/api/product", productRouter);
app.use("/api/order", orderRouter);
app.use("/api/collection", collectionRouter);
app.use("/api/coupon", couponRouter);
app.use("/api/ticket", ticketRouter);
app.use("/api/refund", refundRouter);

//Global Error Handler
app.use(globalErrorHAndler)

// Start listening
app.listen(Port, () => {
  console.log(`Server is running on port ${Port}`);
});