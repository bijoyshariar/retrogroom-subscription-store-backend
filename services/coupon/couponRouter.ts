import { Router } from "express";
import authMiddleware from "../../src/middlewares/authMiddleware";
import { isAdmin } from "../../src/middlewares/isAdmin";
import {
  createCoupon,
  getAllCoupons,
  updateCoupon,
  deleteCoupon,
  validateCoupon,
} from "./couponController";

const couponRouter = Router();

// Admin routes
couponRouter.post("/create", authMiddleware, isAdmin, createCoupon);
couponRouter.get("/all", authMiddleware, isAdmin, getAllCoupons);
couponRouter.put("/:id", authMiddleware, isAdmin, updateCoupon);
couponRouter.delete("/:id", authMiddleware, isAdmin, deleteCoupon);

// Customer route
couponRouter.post("/validate", authMiddleware, validateCoupon);

export default couponRouter;
