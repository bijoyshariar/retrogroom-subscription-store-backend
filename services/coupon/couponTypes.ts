import { Document } from "mongoose";

export type CouponType = "FIXED" | "PERCENTAGE";

export interface CouponDocument extends Document {
  code: string;
  type: CouponType;
  value: number;
  minOrderAmount: number | null;
  maxUses: number | null;
  usedCount: number;
  startsAt: Date | null;
  expiresAt: Date | null;
  isActive: boolean;
}
