import { Request, Response, NextFunction } from "express";
import createHttpError from "http-errors";
import Refund from "./refundModel";
import Order from "../order/orderModel";

interface AuthRequest extends Request {
  user?: any;
}

// Customer: Request Refund (only if not delivered within 24 hours)
export const requestRefund = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  const { orderId, reason } = req.body;
  const userId = req.user._id;

  if (!orderId || !reason) {
    return next(createHttpError(400, "Order ID and reason are required"));
  }

  try {
    const order = await Order.findOne({ _id: orderId, user: userId });
    if (!order) {
      return next(createHttpError(404, "Order not found"));
    }

    // Only allow refund if order is PAID but not yet delivered
    if (!["PAID"].includes(order.status)) {
      return next(
        createHttpError(400, "Refund can only be requested for paid orders that are not yet delivered"),
      );
    }

    // Check if 24 hours have passed since order was paid/created
    const hoursSinceOrder =
      (Date.now() - new Date((order as any).createdAt).getTime()) / (1000 * 60 * 60);
    if (hoursSinceOrder < 24) {
      return next(
        createHttpError(
          400,
          `Please wait 24 hours before requesting a refund. ${Math.ceil(24 - hoursSinceOrder)} hours remaining.`,
        ),
      );
    }

    // Check if refund already exists for this order
    const existingRefund = await Refund.findOne({
      order: orderId,
      status: { $in: ["REQUESTED", "APPROVED"] },
    });
    if (existingRefund) {
      return next(createHttpError(400, "A refund request already exists for this order"));
    }

    const refund = new Refund({
      user: userId,
      order: orderId,
      reason,
      amount: order.totalAmount,
    });

    await refund.save();
    res.status(201).json({ refund, message: "Refund requested successfully. Will be processed within 12 hours." });
  } catch (err: any) {
    return next(createHttpError(500, err.message));
  }
};

// Customer: Get My Refunds
export const getMyRefunds = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  const userId = req.user._id;

  try {
    const refunds = await Refund.find({ user: userId })
      .populate("order", "orderNumber totalAmount status")
      .sort({ createdAt: -1 });
    res.status(200).json(refunds);
  } catch (err: any) {
    return next(createHttpError(500, err.message));
  }
};

// Admin: Get All Refund Requests
export const getAllRefunds = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { status } = req.query;
    const filter: any = {};
    if (status) filter.status = status;

    const refunds = await Refund.find(filter)
      .populate("user", "userName email whatsappNumber")
      .populate("order", "orderNumber totalAmount status paymentMethod")
      .sort({ createdAt: -1 });
    res.status(200).json(refunds);
  } catch (err: any) {
    return next(createHttpError(500, err.message));
  }
};

// Admin: Process Refund (Approve/Reject)
export const processRefund = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { id } = req.params;
  const { status, adminNotes } = req.body;

  if (!status || !["APPROVED", "REJECTED", "PROCESSED"].includes(status)) {
    return next(createHttpError(400, "Valid status (APPROVED/REJECTED/PROCESSED) is required"));
  }

  try {
    const refund = await Refund.findById(id);
    if (!refund) {
      return next(createHttpError(404, "Refund not found"));
    }

    refund.status = status;
    if (adminNotes) refund.adminNotes = adminNotes;

    if (status === "PROCESSED") {
      refund.processedAt = new Date();
      // Update the order status to CANCELLED
      await Order.findByIdAndUpdate(refund.order, { status: "CANCELLED" });
    }

    await refund.save();
    res.status(200).json({ refund, message: `Refund ${status.toLowerCase()} successfully` });
  } catch (err: any) {
    return next(createHttpError(500, err.message));
  }
};
