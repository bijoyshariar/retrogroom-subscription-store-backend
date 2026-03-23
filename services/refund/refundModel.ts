import mongoose, { Schema } from "mongoose";
import { RefundDocument } from "./refundTypes";
import crypto from "crypto";

const refundSchema = new Schema<RefundDocument>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    order: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    refundNumber: {
      type: String,
      unique: true,
    },
    reason: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["REQUESTED", "APPROVED", "REJECTED", "PROCESSED"],
      default: "REQUESTED",
    },
    adminNotes: {
      type: String,
      default: "",
    },
    requestedAt: {
      type: Date,
      default: Date.now,
    },
    processedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

refundSchema.pre("save", function (next) {
  if (!this.refundNumber) {
    this.refundNumber = "RF-" + Date.now().toString(36).toUpperCase() + crypto.randomBytes(2).toString("hex").toUpperCase();
  }
  next();
});

const Refund = mongoose.model<RefundDocument>("Refund", refundSchema);
export default Refund;
