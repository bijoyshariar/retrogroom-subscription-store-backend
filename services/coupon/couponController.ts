import { Request, Response, NextFunction } from "express";
import createHttpError from "http-errors";
import Coupon from "./couponModel";

interface AuthRequest extends Request {
  user?: any;
}

// Admin: Create Coupon
export const createCoupon = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { code, type, value, minOrderAmount, maxUses, startsAt, expiresAt } =
    req.body;

  if (!code || !type || !value) {
    return next(createHttpError(400, "Code, type, and value are required"));
  }

  try {
    const existing = await Coupon.findOne({ code: code.toUpperCase() });
    if (existing) {
      return next(createHttpError(400, "Coupon code already exists"));
    }

    const coupon = new Coupon({
      code,
      type,
      value,
      minOrderAmount,
      maxUses,
      startsAt,
      expiresAt,
    });

    await coupon.save();
    res.status(201).json({ coupon, message: "Coupon created successfully" });
  } catch (err: any) {
    return next(createHttpError(500, err.message));
  }
};

// Admin: Get All Coupons
export const getAllCoupons = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.status(200).json(coupons);
  } catch (err: any) {
    return next(createHttpError(500, err.message));
  }
};

// Admin: Update Coupon
export const updateCoupon = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { id } = req.params;

  try {
    const coupon = await Coupon.findByIdAndUpdate(id, req.body, { new: true });
    if (!coupon) {
      return next(createHttpError(404, "Coupon not found"));
    }
    res.status(200).json({ coupon, message: "Coupon updated successfully" });
  } catch (err: any) {
    return next(createHttpError(500, err.message));
  }
};

// Admin: Delete Coupon
export const deleteCoupon = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { id } = req.params;

  try {
    const coupon = await Coupon.findByIdAndDelete(id);
    if (!coupon) {
      return next(createHttpError(404, "Coupon not found"));
    }
    res.status(200).json({ message: "Coupon deleted successfully" });
  } catch (err: any) {
    return next(createHttpError(500, err.message));
  }
};

// Customer: Validate & Apply Coupon
export const validateCoupon = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { code, orderAmount } = req.body;

  if (!code) {
    return next(createHttpError(400, "Coupon code is required"));
  }

  try {
    const coupon = await Coupon.findOne({
      code: code.toUpperCase(),
      isActive: true,
    });

    if (!coupon) {
      return next(createHttpError(404, "Invalid or inactive coupon"));
    }

    const now = new Date();
    if (coupon.startsAt && now < coupon.startsAt) {
      return next(createHttpError(400, "Coupon is not yet active"));
    }
    if (coupon.expiresAt && now > coupon.expiresAt) {
      return next(createHttpError(400, "Coupon has expired"));
    }
    if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
      return next(createHttpError(400, "Coupon usage limit reached"));
    }
    if (coupon.minOrderAmount && orderAmount < coupon.minOrderAmount) {
      return next(
        createHttpError(
          400,
          `Minimum order amount is ৳${coupon.minOrderAmount}`,
        ),
      );
    }

    let discount = 0;
    if (coupon.type === "FIXED") {
      discount = coupon.value;
    } else if (coupon.type === "PERCENTAGE") {
      discount = (orderAmount * coupon.value) / 100;
    }

    res.status(200).json({
      valid: true,
      couponId: coupon._id,
      discount,
      message: `Coupon applied! You save ৳${discount}`,
    });
  } catch (err: any) {
    return next(createHttpError(500, err.message));
  }
};
