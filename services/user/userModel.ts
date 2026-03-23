import { model, Schema } from "mongoose";
import { UserDocument } from "./userTypes";

const cartItemSchema = new Schema({
  product: {
    type: Schema.Types.ObjectId,
    ref: "Product",
  },
  quantity: Number,
  size: String,
  color: String,
});

const userSchema = new Schema<UserDocument>(
  {
    userName: {
      type: String,
      unique: true,
      required: true,
    },
    firstName: String,
    lastName: String,
    email: {
      type: String,
      unique: true,
      required: true,
    },
    mobile: String,
    whatsappNumber: String,
    password: {
      type: String,
      required: true,
    },
    roles: {
      type: String,
      enum: ["ADMIN", "CUSTOMER"],
      default: "CUSTOMER",
    },
    cart: [cartItemSchema],
    cartTotal: Number,
    shipmentAddress: String,
    state: String,
    city: String,
    zipcode: String,
    wishlist: [
      {
        type: Schema.Types.ObjectId,
        ref: "Product",
      },
    ],
    refreshToken: String,
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    otp: String,
    otpExpires: Date,
    otpType: {
      type: String,
      enum: ["SMS", "EMAIL"],
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

const User = model<UserDocument>("User", userSchema);
export default User;
