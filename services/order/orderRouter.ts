import { Router } from "express";
import authMiddleware from "../../src/middlewares/authMiddleware";
import {
  allOrders,
  allUserOrders,
  createOrder,
  sslPaymentCancelled,
  sslPaymentFailure,
  sslPaymentSuccess,
  updateOrderStatus,
  assignCredentials,
  markOrderActive,
  markOrderExpired,
  requestRenewal,
  getMySubscriptions,
} from "./orderController";
import { isAdmin } from "../../src/middlewares/isAdmin";

const orderRouter = Router();

// Admin routes
orderRouter.get("/all-orders", authMiddleware, isAdmin, allOrders);
orderRouter.put("/status-update/:id", authMiddleware, isAdmin, updateOrderStatus);
orderRouter.put("/assign-credentials/:id", authMiddleware, isAdmin, assignCredentials);
orderRouter.put("/mark-active/:id", authMiddleware, isAdmin, markOrderActive);
orderRouter.put("/mark-expired/:id", authMiddleware, isAdmin, markOrderExpired);

// Customer routes
orderRouter.get("/user-order", authMiddleware, allUserOrders);
orderRouter.get("/my-subscriptions", authMiddleware, getMySubscriptions);
orderRouter.post("/create", authMiddleware, createOrder);
orderRouter.post("/renew", authMiddleware, requestRenewal);

// Payment callbacks
orderRouter.post("/ssl-payment-success/:id", sslPaymentSuccess);
orderRouter.post("/ssl-payment-cancel/:id", sslPaymentCancelled);
orderRouter.post("/ssl-payment-fail/:id", sslPaymentFailure);

export default orderRouter;
