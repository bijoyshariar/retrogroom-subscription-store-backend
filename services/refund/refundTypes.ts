import mongoose, { Document } from "mongoose";

export interface RefundDocument extends Document {
  user: mongoose.Types.ObjectId;
  order: mongoose.Types.ObjectId;
  refundNumber: string;
  reason: string;
  amount: number;
  status: "REQUESTED" | "APPROVED" | "REJECTED" | "PROCESSED";
  adminNotes: string;
  requestedAt: Date;
  processedAt: Date | null;
}
