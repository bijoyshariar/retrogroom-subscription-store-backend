import { Document, Types } from "mongoose";

interface CartItem {
  product: Types.ObjectId;
  quantity: number;
  color: string;
  size: string;
  variantId?: Types.ObjectId;
}

export interface UserDocument extends Document {
  userName: string;
  firstName: string;
  lastName: string;
  email: string;
  mobile: string;
  whatsappNumber: string;
  password: string;
  roles: "ADMIN" | "CUSTOMER";
  cart: CartItem[];
  cartTotal: number;
  shipmentAddress: string;
  state: string;
  city: string;
  zipcode: string;
  wishlist: Types.ObjectId[];
  refreshToken?: string;
  passwordChangedAt?: Date;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  otp?: string;
  otpExpires?: Date;
  otpType?: "SMS" | "EMAIL";
  isVerified: boolean;
}
