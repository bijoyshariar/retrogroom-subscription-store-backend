import express from "express";
import {
  register,
  login,
  admin,
  handleRefreshToken,
  logout,
  updatedUser,
  updateAddress,
  getAllUser,
  updatePassword,
  forgotPasswordToken,
  resetPassword,
  addWishlist,
  removeWishlistItem,
  addCart,
  removeCartItem,
  increaseCartItemQuantity,
  decreaseCartItemQuantity,
  getWishlist,
  addRatingAndComment,
  sendOtp,
  verifyOtp,
} from "./userController";
import { isAdmin } from "../../src/middlewares/isAdmin";
import authMiddleware from "../../src/middlewares/authMiddleware";

const userRouter = express.Router();

userRouter.get("/all", authMiddleware, isAdmin, getAllUser);
userRouter.get("/get-wishlist", authMiddleware, getWishlist);
userRouter.post("/register", register);
userRouter.post("/login", login);
userRouter.post("/admin", admin);
userRouter.get("/refresh-token", handleRefreshToken);
userRouter.post("/logout", authMiddleware, logout);
userRouter.put("/update-user", authMiddleware, updatedUser);
userRouter.put("/update-address", authMiddleware, updateAddress);
userRouter.put("/update-password", authMiddleware, updatePassword);
userRouter.post("/forgot-password-token", forgotPasswordToken);
userRouter.put("/reset-password/:token", resetPassword);
userRouter.post("/add-wishlist", authMiddleware, addWishlist);
userRouter.put("/remove-wishlist", authMiddleware, removeWishlistItem);
userRouter.post("/add-cart", authMiddleware, addCart);
userRouter.post("/remove-cartitem", authMiddleware, removeCartItem);
userRouter.post(
  "/add-cart-quantity-increase",
  authMiddleware,
  increaseCartItemQuantity,
);
userRouter.post(
  "/add-cart-quantity-decrease",
  authMiddleware,
  decreaseCartItemQuantity,
);
userRouter.post("/review", authMiddleware, addRatingAndComment);
userRouter.post("/send-otp", authMiddleware, sendOtp);
userRouter.post("/verify-otp", authMiddleware, verifyOtp);

export default userRouter;
