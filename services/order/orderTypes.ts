import mongoose, { Document } from "mongoose";

export interface OrderProductDocument extends Document {
  product: mongoose.Types.ObjectId;
  color: string;
  size: string;
  quantity: number;
  reviewToken: string;
  variantId: mongoose.Types.ObjectId;
  variantName: string;
}

export interface OrderCredentialDocument {
  email: string;
  password: string;
  renewDate: Date | null;
  notes: string;
}

export interface OrderDocument extends Document {
  user: mongoose.Types.ObjectId;
  orderNumber: string;
  products: OrderProductDocument[];
  totalAmount: number;
  discount: number;
  status: "PENDING" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED" | "PAID" | "ACTIVE" | "EXPIRED";
  shipmentAddress: string;
  city: string;
  state: string;
  zip: string;
  paymentMethod: "COD" | "SSLCOMMERZ" | "UDDOKTAPAY";
  transectionId: string;
  credentials: OrderCredentialDocument;
  deliveryMethod: "DASHBOARD" | "WHATSAPP";
  deliveredAt: Date;
  coupon: mongoose.Types.ObjectId;
  isRenewal: boolean;
  originalOrder: mongoose.Types.ObjectId;
}
