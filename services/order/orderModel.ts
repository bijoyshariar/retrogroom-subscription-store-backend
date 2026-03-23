import mongoose, { Schema } from "mongoose";
import { OrderDocument, OrderProductDocument } from "./orderTypes";
import crypto from "crypto";

const orderProductSchema = new Schema<OrderProductDocument>({
  product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
  color: { type: String },
  size: { type: String },
  quantity: { type: Number, required: true },
  reviewToken: String,
  variantId: { type: Schema.Types.ObjectId },
  variantName: { type: String },
});

const credentialSchema = new Schema({
  email: { type: String },
  password: { type: String },
  renewDate: { type: Date, default: null },
  notes: { type: String },
}, { _id: false });

const orderSchema = new Schema<OrderDocument>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    orderNumber: { type: String, unique: true },
    products: { type: [orderProductSchema], required: true },
    totalAmount: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "PAID", "ACTIVE", "EXPIRED"],
      default: "PENDING",
    },
    shipmentAddress: { type: String },
    city: { type: String },
    state: { type: String },
    zip: { type: String },
    paymentMethod: {
      type: String,
      enum: ["COD", "SSLCOMMERZ", "UDDOKTAPAY"],
      default: "SSLCOMMERZ",
    },
    transectionId: { type: String },
    credentials: credentialSchema,
    deliveryMethod: {
      type: String,
      enum: ["DASHBOARD", "WHATSAPP"],
      default: "DASHBOARD",
    },
    deliveredAt: { type: Date },
    coupon: { type: Schema.Types.ObjectId, ref: "Coupon" },
    isRenewal: { type: Boolean, default: false },
    originalOrder: { type: Schema.Types.ObjectId, ref: "Order" },
  },
  { timestamps: true },
);

orderSchema.pre("save", function (next) {
  if (!this.orderNumber) {
    this.orderNumber = "CC-" + Date.now().toString(36).toUpperCase() + crypto.randomBytes(3).toString("hex").toUpperCase();
  }
  next();
});

orderSchema.index({ user: 1, status: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ orderNumber: 1 });

const Order = mongoose.model<OrderDocument>("Order", orderSchema);
export default Order;
