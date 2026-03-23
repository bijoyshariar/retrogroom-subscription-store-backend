import { Router } from "express";
import authMiddleware from "../../src/middlewares/authMiddleware";
import { isAdmin } from "../../src/middlewares/isAdmin";
import {
  requestRefund,
  getMyRefunds,
  getAllRefunds,
  processRefund,
} from "./refundController";

const refundRouter = Router();

// Customer routes
refundRouter.post("/request", authMiddleware, requestRefund);
refundRouter.get("/my-refunds", authMiddleware, getMyRefunds);

// Admin routes
refundRouter.get("/admin/all", authMiddleware, isAdmin, getAllRefunds);
refundRouter.put("/admin/:id", authMiddleware, isAdmin, processRefund);

export default refundRouter;
