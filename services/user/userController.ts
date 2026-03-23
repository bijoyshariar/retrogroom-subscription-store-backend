// import { Request, Response, NextFunction } from 'express';
// import createHttpError from 'http-errors';
// import bcrypt from 'bcrypt';
// import jwt from "jsonwebtoken";
// import crypto from "crypto";
// import User from "../../services/user/userModel";
// import Product from "../product/productModel";
// import {config} from "../../src/config";
// interface AuthRequest extends Request {
//     user?: any;
// }
//
//
// //Register New User
// export const register = async (req: Request, res: Response, next: NextFunction) => {
//     const { userName, email, password } = req.body;
//     if (!userName || !email || !password) {
//         return next(createHttpError(400, "All fields are required"));
//     }
//
//     try {
//         const existingUser = await User.findOne({ $or: [{ userName }, { email }] });
//         if (existingUser) {
//             const field = existingUser.userName === userName ? 'User Name' : 'Email';
//             return next(createHttpError(400, `${field} already exists`));
//         }
//
//         const hashPassword = await bcrypt.hash(password, 12);
//         const user = new User({
//             userName,
//             email,
//             password: hashPassword
//         });
//
//         await user.save();
//
//         const token = jwt.sign({ sub: user._id }, config.jwtSecret as string, { expiresIn: "1h" });
//         const refreshToken = jwt.sign({_id: user._id} , config.jwtSecret as string, { expiresIn: "3d" });
//
//         res.cookie('Bearer', refreshToken, { httpOnly: true, maxAge: 259200000 });
//         res.status(201).json({ token, message: 'Registered successfully' });
//     } catch (error) {
//         next(createHttpError(500, 'Server Error'));
//     }
// };
//
//
// // Login
// export const login = async (req: Request, res: Response, next: NextFunction) => {
//     const { email, password } = req.body;
//     if (!email || !password) {
//         return next(createHttpError(400, "All fields are required"));
//     }
//
//     try {
//         const user = await User.findOne({ email });
//         if (!user) {
//             return next(createHttpError(400, 'Invalid credentials'));
//         }
//
//         const isMatch = await bcrypt.compare(password, user.password);
//         if (!isMatch) {
//             return next(createHttpError(400, 'Invalid credentials'));
//         }
//
//         const token = jwt.sign({ _id: user._id }, config.jwtSecret as string, { expiresIn: "24h" });
//         const refreshToken = jwt.sign({_id: user._id} , config.jwtSecret as string, { expiresIn: "3d" });
//
//         user.refreshToken = refreshToken;
//         await user.save();
//
//         res.cookie('Bearer', refreshToken, { httpOnly: true, maxAge: 259200000 });
//         res.status(200).json({ token, message: 'Logged in successfully' });
//     } catch (error) {
//         next(createHttpError(500, 'Server Error'));
//     }
// };
//
//
// //Admin Login
// export const admin = async (req: Request, res: Response, next: NextFunction) => {
//     const { email, password } = req.body;
//     if (!email || !password) {
//         return next(createHttpError(400, "All fields are required"));
//     }
//
//     try {
//         const user = await User.findOne({ email });
//         if (!user || user.roles !== "ADMIN") {
//             return next(createHttpError(401, 'Unauthorized'));
//         }
//
//         const isPasswordMatch = await bcrypt.compare(password, user.password);
//         if (!isPasswordMatch) {
//             return next(createHttpError(401, 'Invalid credentials'));
//         }
//
//         const token = jwt.sign({ _id: user._id }, config.jwtSecret as string, { expiresIn: "1d" });
//         const refreshToken = jwt.sign({ _id: user._id }, config.jwtSecret as string, { expiresIn: "3d" });
//
//         user.refreshToken = refreshToken;
//         await user.save();
//
//         res.cookie('Bearer', refreshToken, { httpOnly: true, maxAge: 259200000 });
//         res.status(200).json({ token, message: 'Admin logged in successfully' });
//     } catch (error) {
//         next(createHttpError(500, 'Server Error'));
//     }
// };
//
//
// // Handle Refresh Token
// export const handleRefreshToken = async (req: Request, res: Response, next: NextFunction) => {
//     const cookie = req.headers.cookie;
//     if (!cookie) {
//         return next(createHttpError(401, 'No refresh token provided'));
//     }
//     const refreshToken = cookie.split("=")[1]
//
//     try {
//         const decoded: any = jwt.verify(refreshToken, config.jwtSecret as string);
//         const user = await User.findById(decoded._id);
//         if (!user) {
//             return next(createHttpError(404, 'User not found'));
//         }
//         const accessToken = jwt.sign({_id:user._id}, config.jwtSecret as string, { expiresIn: "1d" });
//
//         res.status(200).json({ accessToken, message: 'Your access token' });
//     } catch (error: any) {
//         next(createHttpError(500, `Server Error: ${error}`));
//     }
// };
//
//
// //Logout
// export const logout = async (req: Request, res: Response, next: NextFunction) => {
//     try {
//         const cookie = req.headers.cookie;
//         if (!cookie) {
//             return next(createHttpError(401, 'No refresh token provided'));
//         }
//         const refreshToken = cookie.split("=")[1]
//
//         const user = await User.findOne({ refreshToken });
//         if (!user) {
//             return next(createHttpError(404, 'User not found'));
//         }
//
//         // Clear refresh token from user document
//         user.refreshToken = undefined;
//         await user.save();
//
//         // Clear cookie
//         res.clearCookie('Bearer');
//         res.status(200).json({ message: 'Logged out successfully' });
//     } catch (error: any) {
//         next(createHttpError(500, error));
//     }
// };
//
//
// //Update User
// export const updatedUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
//     const userId = req.user._id; // Assuming user ID is available in req.user
//     const { firstName, lastName, email, mobile } = req.body;
//
//     try {
//         const user = await User.findById(userId);
//         if (!user) {
//             return next(createHttpError(404, 'User not found'));
//         }
//
//         user.firstName = firstName || user.firstName;
//         user.lastName = lastName || user.lastName;
//         user.email = email || user.email;
//         user.mobile = mobile || user.mobile;
//
//         await user.save();
//
//         res.status(200).json({ user, message: 'User updated successfully' });
//     } catch (error) {
//         next(createHttpError(500, 'Server Error'));
//     }
// };
//
//
// //Update User Address
// export const updateAddress = async (req: AuthRequest, res: Response, next: NextFunction) => {
//     const userId = req.user._id; // Assuming user ID is available in req.user
//     const { shipmentAddress, state, city, zipcode } = req.body;
//
//     try {
//         const user = await User.findById(userId);
//         if (!user) {
//             return next(createHttpError(404, 'User not found'));
//         }
//
//         user.shipmentAddress = shipmentAddress;
//         user.state = state;
//         user.city = city;
//         user.zipcode = zipcode;
//
//         await user.save();
//
//         res.status(200).json({ user, message: 'Address updated successfully' });
//     } catch (error) {
//         next(createHttpError(500, 'Server Error'));
//     }
// };
//
//
// //Get All User
// export const getAllUser = async (req: Request, res: Response, next: NextFunction) => {
//     try {
//         const users = await User.find();
//         res.status(200).json(users);
//     } catch (error) {
//         next(createHttpError(500, 'Server Error'));
//     }
// };
//
//
// //Password Update
// export const updatePassword = async (req: AuthRequest, res: Response, next: NextFunction) => {
//     const userId = req.user._id; // Assuming user ID is available in req.user
//     const { currentPassword, newPassword } = req.body;
//
//     try {
//         const user = await User.findById(userId);
//         if (!user) {
//             return next(createHttpError(404, 'User not found'));
//         }
//
//         const isMatch = await bcrypt.compare(currentPassword, user.password);
//         if (!isMatch) {
//             return next(createHttpError(401, 'Current password is incorrect'));
//         }
//
//         user.password = await bcrypt.hash(newPassword, 12);
//         await user.save();
//
//         res.status(200).json({ message: 'Password updated successfully' });
//     } catch (error) {
//         next(createHttpError(500, 'Server Error'));
//     }
// };
//
//
// //Forget Password Token
// export const forgotPasswordToken = async (req: Request, res: Response, next: NextFunction) => {
//     const { email } = req.body;
//
//     try {
//         const user = await User.findOne({ email });
//         if (!user) {
//             return next(createHttpError(404, 'User not found'));
//         }
//         const resetToken = crypto.randomBytes(32).toString("hex");
//         user.passwordResetToken = resetToken;
//         user.passwordResetExpires = new Date(Date.now() + 30 * 60 * 1000)
//         await user.save();
//
//         const resetURL = `http://localhost:4000/api/user/reset-password/${resetToken}`;
//         // Send resetURL to user via email or other means
//
//         res.status(200).json({ resetURL, message: 'Reset password token sent successfully' });
//     } catch (error) {
//         next(createHttpError(500, 'Server Error'));
//     }
// };
//
//
// //Reset Password
// export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
//     const { password } = req.body;
//     const { token } = req.params;
//
//     try {
//         const user = await User.findOne({
//             passwordResetToken: token,
//             passwordResetExpires: { $gt: Date.now() },
//         });
//
//         if (!user) {
//             return next(createHttpError(400, 'Password reset token is invalid or has expired'));
//         }
//
//         user.password = await bcrypt.hash(password, 12);
//         user.passwordResetToken = undefined;
//         user.passwordResetExpires = undefined;
//         await user.save();
//
//         res.status(200).json({ message: 'Password reset successfully' });
//     } catch (error) {
//         next(createHttpError(500, 'Server Error'));
//     }
// };
//
//
// //Add Wishlist
// export const addWishlist = async (req: AuthRequest, res: Response, next: NextFunction) => {
//     const { productId } = req.body;
//     const userId: any = req.user?._id; // Make sure to handle the case where req.user might be undefined
//
//     try {
//         if (!userId) {
//             return next(createHttpError(404, 'User not found'));
//         }
//
//         const user = await User.findById(userId);
//         if (!user) {
//             return next(createHttpError(404, 'User not found'));
//         }
//
//         // Check if product already exists in wishlist
//         if (user.wishlist.includes(productId)) {
//             return next(createHttpError(400, 'Product already exists in wishlist'));
//         }
//
//         // Add product to wishlist
//         user.wishlist.push(productId);
//         await user.save();
//
//         res.status(200).json({ message: 'Product added to wishlist successfully' });
//     } catch (error) {
//         next(createHttpError(500, 'Server Error'));
//     }
// };
//
//
// //Get Wishlist
// export const getWishlist = async (req: AuthRequest, res: Response, next: NextFunction) => {
//     const userId = req.user?._id;
//
//     try {
//         const findUser = await User.findById(userId).populate("wishlist");
//         if (!findUser) {
//             return next(createHttpError(404, 'User not found'));
//         }
//         res.json(findUser);
//     } catch (error: any) {
//         next(createHttpError(500, error.message));
//     }
// };
//
//
// export const removeWishlistItem = async (req: AuthRequest, res: Response, next: NextFunction) => {
//     const { productId } = req.body; // Assuming productId is provided in the body
//     const userId = req.user?._id;
//
//     try {
//         if (!userId) {
//             return next(createHttpError(404, 'User Id not found'));
//         }
//
//         const user = await User.findById(userId);
//         if (!user) {
//             return next(createHttpError(404, 'User not found'));
//         }
//
//         // Check if product exists in wishlist
//         const productIndex = user.wishlist.indexOf(productId);
//         if (productIndex === -1) {
//             return next(createHttpError(404, 'Product not found in wishlist'));
//         }
//
//         // Remove product from wishlist
//         user.wishlist.splice(productIndex, 1);
//         await user.save();
//
//         res.status(200).json({ message: 'Product removed from wishlist successfully', wishlist: user.wishlist });
//     } catch (error) {
//         next(createHttpError(500, 'Server Error'));
//     }
// };
//
//
// export const addCart = async (req: AuthRequest, res: Response, next: NextFunction) => {
//     const { productId, quantity, color, size } = req.body;
//
//     try {
//         // Validate input
//         if (!productId || !quantity || !color || !size) {
//             return next(createHttpError(400, 'All fields are required'));
//         }
//
//         // Find the product by ID
//         const product = await Product.findById(productId);
//         if (!product) {
//             return next(createHttpError(404, `Product with ID ${productId} not found`));
//         }
//
//         // Find the product variant by color and size
//         const productStock = product.productStock.find(
//             (stock) => stock.color === color && stock.size === size
//         );
//
//         // Check if the product variant exists
//         if (!productStock) {
//             return next(createHttpError(400, `Product variant for color: ${color}, size: ${size} not found`));
//         }
//
//         // Check if the requested quantity is available
//         if (productStock.quantity < quantity) {
//             return next(createHttpError(400, `Insufficient stock for product ${product.productName}, color: ${color}, size: ${size}. Available: ${productStock.quantity}, Requested: ${quantity}`));
//         }
//
//         // Add the product to the cart (Assuming you have a Cart model or similar logic)
//         const cart = req.user.cart || [];
//         const cartItemIndex = cart.findIndex((item: any) =>
//             item.product.toString() === productId && item.color === color && item.size === size
//         );
//
//         if (cartItemIndex > -1) {
//             // If the item already exists in the cart, update the quantity
//             cart[cartItemIndex].quantity += quantity;
//         } else {
//             // Otherwise, add a new item to the cart
//             cart.push({
//                 product: productId,
//                 quantity,
//                 color,
//                 size
//             });
//         }
//
//         // Update the cart total
//         let cartTotal = 0;
//         for (const item of cart) {
//             const product = await Product.findById(item.product);
//             if (product) {
//                 const productPrice = product.productPrice;
//                 cartTotal += productPrice * item.quantity;
//             }
//         }
//
//         // Save the user's updated cart and cart total
//         req.user.cart = cart;
//         req.user.cartTotal = cartTotal;
//         await req.user.save();
//
//         res.status(201).json({ message: 'Product added to cart successfully', cart: req.user.cart, cartTotal: req.user.cartTotal });
//     } catch (err: any) {
//         return next(createHttpError(500, err.message));
//     }
// };
//
// export const removeCartItem = async (req: AuthRequest, res: Response, next: NextFunction) => {
//     const { productId, color, size } = req.body;
//     const userId = req.user?._id;
//
//     try {
//         if (!userId) {
//             return next(createHttpError(404, 'User Id not found'));
//         }
//
//         const user = await User.findById(userId);
//         if (!user) {
//             return next(createHttpError(404, 'User not found'));
//         }
//
//         // Check if product exists in cart
//         const cartItemIndex = user.cart.findIndex((item: any) =>
//             item.product.toString() === productId && item.color === color && item.size === size
//         );
//         if (cartItemIndex === -1) {
//             return next(createHttpError(404, 'Product not found in cart'));
//         }
//
//         // Remove product from cart
//         user.cart.splice(cartItemIndex, 1);
//         await user.save();
//
//         // Update cart total
//         const cartTotal = await updateCartTotal(user)
//
//
//         res.status(200).json({ message: 'Product removed from cart successfully', cart: req.user.cart, cartTotal: cartTotal });
//     } catch (error) {
//         next(createHttpError(500, 'Server Error'));
//     }
// };
//
// const updateCartTotal = async (user: any) => {
//     try {
//         let cartTotal = 0;
//         for (const item of user.cart) {
//             const product = await Product.findById(item.product);
//             if (!product) {
//                 continue;
//             }
//             const productStock = product.productStock.find((stock: any) => stock.color === item.color && stock.size === item.size);
//             if (!productStock) {
//                 continue;
//             }
//             cartTotal += product.productPrice * item.quantity;
//         }
//         user.cartTotal = cartTotal;
//         await user.save();
//         return cartTotal
//     } catch (error) {
//         throw new Error('Failed to update cart total');
//     }
// };
//
// // Decrease cart item quantity
// export const decreaseCartItemQuantity = async (req: AuthRequest, res: Response, next: NextFunction) => {
//     const { productId, color, size } = req.body;
//     const userId = req.user?._id;
//
//     try {
//         if (!userId) {
//             return next(createHttpError(404, 'User Id not found'));
//         }
//
//         const user = await User.findById(userId);
//         if (!user) {
//             return next(createHttpError(404, 'User not found'));
//         }
//
//         // Find cart item index
//         const cartItemIndex = user.cart.findIndex((item: any) =>
//             item.product.toString() === productId && item.color === color && item.size === size
//         );
//         if (cartItemIndex === -1) {
//             return next(createHttpError(404, 'Product not found in cart'));
//         }
//
//         // Decrease quantity
//         if (user.cart[cartItemIndex].quantity > 1) {
//             user.cart[cartItemIndex].quantity -= 1;
//         } else {
//             // If quantity is already 1, remove the item from the cart
//             user.cart.splice(cartItemIndex, 1);
//         }
//
//         await user.save();
//
//         // Update cart total
//         const cartTotal = await updateCartTotal(user)
//
//         res.status(200).json({ message: 'Cart item quantity decreased successfully', cart: user.cart, cartTotal: cartTotal });
//     } catch (error) {
//         next(createHttpError(500, 'Server Error'));
//     }
// };
//
// // Increase cart item quantity
// export const increaseCartItemQuantity = async (req: AuthRequest, res: Response, next: NextFunction) => {
//     const { productId, color, size } = req.body;
//     const userID = req.user?._id;
//
//     try {
//         if (!userID) {
//             return next(createHttpError(404, 'User Id not found'));
//         }
//
//         const userr = await User.findById(userID);
//         if (!userr) {
//             return next(createHttpError(404, 'User not found'));
//         }
//
//         // Find cart item index
//         const cartItemIndex = userr.cart.findIndex((item: any) =>
//             item.product.toString() === productId && item.color === color && item.size === size
//         );
//         if (cartItemIndex === -1) {
//             return next(createHttpError(404, 'Product not found in cart'));
//         }
//
//         // Increase quantity
//         userr.cart[cartItemIndex].quantity += 1;
//
//         await userr.save();
//
//         // Update cart total
//         const cartTotal = await updateCartTotal(userr)
//
//         res.status(200).json({ message: 'Cart item quantity increased successfully', cart: userr.cart, cartTotal: cartTotal });
//     } catch (error) {
//         next(createHttpError(500, 'Server Error'));
//     }
// }

//////////////////////////////////////
//                                  //
//         Updated Version          //
//                                  //
//////////////////////////////////////

import { Request, Response, NextFunction } from "express";
import createHttpError from "http-errors";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import User from "../../services/user/userModel";
import Product from "../product/productModel";
import Order from "../order/orderModel";
import { config } from "../../src/config";

interface AuthRequest extends Request {
  user?: any;
}

const findUserById = async (userId: string, next: NextFunction) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      return next(createHttpError(404, "User not found"));
    }
    return user;
  } catch (error) {
    return next(createHttpError(500, "Server Error"));
  }
};

const generateTokens = (userId: string) => {
  const token = jwt.sign({ sub: userId }, config.jwtSecret as string, {
    expiresIn: "1h",
  });
  const refreshToken = jwt.sign({ _id: userId }, config.jwtSecret as string, {
    expiresIn: "3d",
  });
  return { token, refreshToken };
};

const updateCartTotal = async (user: any) => {
  try {
    let cartTotal = 0;
    for (const item of user.cart) {
      const product = await Product.findById(item.product);
      if (!product) {
        continue;
      }
      cartTotal += product.productPrice * item.quantity;
    }
    user.cartTotal = cartTotal;
    await user.save();
    return cartTotal;
  } catch (error) {
    throw new Error("Failed to update cart total");
  }
};

const checkRequiredFields: any = (fields: any[], next: NextFunction) => {
  for (const field of fields) {
    if (!field) {
      return next(createHttpError(400, "All fields are required"));
    }
  }
};

// Register New User
export const register = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { userName, email, password, mobile, whatsappNumber } = req.body;
  if (checkRequiredFields([userName, email, password], next)) return;

  try {
    const existingUser = await User.findOne({ $or: [{ userName }, { email }] });
    if (existingUser) {
      const field = existingUser.userName === userName ? "User Name" : "Email";
      return next(createHttpError(400, `${field} already exists`));
    }

    const hashPassword = await bcrypt.hash(password, 12);
    const user = new User({
      userName,
      email,
      password: hashPassword,
      mobile: mobile || "",
      whatsappNumber: whatsappNumber || "",
    });

    await user.save();
    const { token, refreshToken } = generateTokens(user._id);

    res.cookie("Bearer", refreshToken, { httpOnly: true, maxAge: 259200000 });
    res.status(201).json({ token, message: "Registered successfully" });
  } catch (error) {
    next(createHttpError(500, "Server Error"));
  }
};

// Login
export const login = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { email, password } = req.body;
  if (checkRequiredFields([email, password], next)) return;

  try {
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return next(createHttpError(400, "Invalid credentials"));
    }

    const { token, refreshToken } = generateTokens(user._id);
    user.refreshToken = refreshToken;
    await user.save();

    res.cookie("Bearer", refreshToken, { httpOnly: true, maxAge: 259200000 });
    res.status(200).json({ token, message: "Logged in successfully" });
  } catch (error) {
    next(createHttpError(500, "Server Error"));
  }
};

// Admin Login
export const admin = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { email, password } = req.body;
  console.log(req.headers);
  if (checkRequiredFields([email, password], next)) return;

  try {
    const user = await User.findOne({ email });
    if (
      !user ||
      user.roles !== "ADMIN" ||
      !(await bcrypt.compare(password, user.password))
    ) {
      return next(createHttpError(401, "Unauthorized or Invalid credentials"));
    }

    const { token, refreshToken } = generateTokens(user._id);
    user.refreshToken = refreshToken;
    await user.save();

    res.cookie("Bearer", refreshToken, { httpOnly: true, maxAge: 259200000 });
    res.status(200).json({ token, message: "Admin logged in successfully" });
  } catch (error) {
    next(createHttpError(500, "Server Error"));
  }
};

// Handle Refresh Token
export const handleRefreshToken = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const cookie = req.headers.cookie;
  if (!cookie) {
    return next(createHttpError(401, "No refresh token provided"));
  }
  const refreshToken = cookie.split("=")[1];

  try {
    const decoded: any = jwt.verify(refreshToken, config.jwtSecret as string);
    const user = await User.findById(decoded._id);
    if (!user) {
      return next(createHttpError(404, "User not found"));
    }
    const accessToken = jwt.sign(
      { _id: user._id },
      config.jwtSecret as string,
      { expiresIn: "1d" },
    );

    res.status(200).json({ accessToken, message: "Your access token" });
  } catch (error: any) {
    next(createHttpError(500, `Server Error: ${error.message}`));
  }
};

// Logout
export const logout = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const cookie = req.headers.cookie;
    if (!cookie) {
      return next(createHttpError(401, "No refresh token provided"));
    }
    const refreshToken = cookie.split("=")[1];

    const user = await User.findOne({ refreshToken });
    if (!user) {
      return next(createHttpError(404, "User not found"));
    }

    user.refreshToken = undefined;
    await user.save();

    res.clearCookie("Bearer");
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error: any) {
    next(createHttpError(500, error.message));
  }
};

// Update User
export const updatedUser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  const userId = req.user._id;
  const { firstName, lastName, email, mobile, whatsappNumber } = req.body;

  try {
    const user = await findUserById(userId, next);
    if (!user) return;

    user.firstName = firstName || user.firstName;
    user.lastName = lastName || user.lastName;
    user.email = email || user.email;
    user.mobile = mobile || user.mobile;
    if (whatsappNumber !== undefined) user.whatsappNumber = whatsappNumber;

    await user.save();
    res.status(200).json({ user, message: "User updated successfully" });
  } catch (error) {
    next(createHttpError(500, "Server Error"));
  }
};

// Update User Address
export const updateAddress = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  const userId = req.user._id;
  const { shipmentAddress, state, city, zipcode } = req.body;

  try {
    const user = await findUserById(userId, next);
    if (!user) return;

    user.shipmentAddress = shipmentAddress;
    user.state = state;
    user.city = city;
    user.zipcode = zipcode;

    await user.save();
    res.status(200).json({ user, message: "Address updated successfully" });
  } catch (error) {
    next(createHttpError(500, "Server Error"));
  }
};

// Get All Users
export const getAllUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const users = await User.find();
    res.status(200).json(users);
  } catch (error) {
    next(createHttpError(500, "Server Error"));
  }
};

// Password Update
export const updatePassword = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  const userId = req.user._id;
  const { currentPassword, newPassword } = req.body;

  try {
    const user = await findUserById(userId, next);
    if (!user) return;

    if (!(await bcrypt.compare(currentPassword, user.password))) {
      return next(createHttpError(401, "Current password is incorrect"));
    }

    user.password = await bcrypt.hash(newPassword, 12);
    await user.save();

    res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    next(createHttpError(500, "Server Error"));
  }
};

// Forget Password Token
export const forgotPasswordToken = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return next(createHttpError(404, "User not found"));
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    user.passwordResetToken = resetToken;
    user.passwordResetExpires = new Date(Date.now() + 30 * 60 * 1000);
    await user.save();

    const resetURL = `http://localhost:4000/api/user/reset-password/${resetToken}`;
    // Send resetURL to user via email or other means

    res
      .status(200)
      .json({ resetURL, message: "Reset password token sent successfully" });
  } catch (error) {
    next(createHttpError(500, "Server Error"));
  }
};

// Reset Password
export const resetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { password } = req.body;
  const { token } = req.params;

  try {
    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
      return next(
        createHttpError(400, "Password reset token is invalid or has expired"),
      );
    }

    user.password = await bcrypt.hash(password, 12);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    res.status(200).json({ message: "Password reset successfully" });
  } catch (error) {
    next(createHttpError(500, "Server Error"));
  }
};

// Add Wishlist
export const addWishlist = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  const { productId } = req.body;
  const userId = req.user?._id;

  try {
    if (!userId) {
      return next(createHttpError(404, "User not found"));
    }

    const user = await findUserById(userId, next);
    if (!user) return;

    if (user.wishlist.includes(productId)) {
      return next(createHttpError(400, "Product already exists in wishlist"));
    }

    user.wishlist.push(productId);
    await user.save();

    res.status(200).json({ message: "Product added to wishlist successfully" });
  } catch (error) {
    next(createHttpError(500, "Server Error"));
  }
};

// Get Wishlist
export const getWishlist = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  const userId = req.user?._id;

  try {
    const findUser = await User.findById(userId).populate("wishlist");
    if (!findUser) {
      return next(createHttpError(404, "User not found"));
    }
    res.json(findUser);
  } catch (error: any) {
    next(createHttpError(500, error.message));
  }
};

// Remove Wishlist Item
export const removeWishlistItem = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  const { productId } = req.body;
  const userId = req.user?._id;

  try {
    if (!userId) {
      return next(createHttpError(404, "User Id not found"));
    }

    const user = await findUserById(userId, next);
    if (!user) return;

    const productIndex = user.wishlist.indexOf(productId);
    if (productIndex === -1) {
      return next(createHttpError(404, "Product not found in wishlist"));
    }

    user.wishlist.splice(productIndex, 1);
    await user.save();

    res
      .status(200)
      .json({
        message: "Product removed from wishlist successfully",
        wishlist: user.wishlist,
      });
  } catch (error) {
    next(createHttpError(500, "Server Error"));
  }
};

// Add Cart
export const addCart = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  const { productId, quantity, color, size } = req.body;
  const userId = req.user?._id;

  if (checkRequiredFields([productId, quantity, color, size], next)) return;

  try {
    const product = await Product.findById(productId);
    if (!product) {
      return next(
        createHttpError(404, `Product with ID ${productId} not found`),
      );
    }

    const productStock = product.productStock.find(
      (stock) => stock.color === color && stock.size === size,
    );
    if (!productStock || productStock.quantity < quantity) {
      return next(
        createHttpError(
          400,
          `Insufficient stock for product ${product.productName}, color: ${color}, size: ${size}`,
        ),
      );
    }

    const user = await findUserById(userId, next);
    if (!user) return;

    const cartItemIndex = user.cart.findIndex(
      (item) =>
        item.product.toString() === productId &&
        item.color === color &&
        item.size === size,
    );

    if (cartItemIndex > -1) {
      user.cart[cartItemIndex].quantity += quantity;
    } else {
      user.cart.push({ product: productId, quantity, color, size });
    }

    const cartTotal = await updateCartTotal(user);

    res
      .status(201)
      .json({
        message: "Product added to cart successfully",
        cart: user.cart,
        cartTotal,
      });
  } catch (error: any) {
    return next(createHttpError(500, error.message));
  }
};

// Remove Cart Item
export const removeCartItem = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  const { productId, color, size } = req.body;
  const userId = req.user?._id;

  try {
    const user = await findUserById(userId, next);
    if (!user) return;

    const cartItemIndex = user.cart.findIndex(
      (item) =>
        item.product.toString() === productId &&
        item.color === color &&
        item.size === size,
    );
    if (cartItemIndex === -1) {
      return next(createHttpError(404, "Product not found in cart"));
    }

    user.cart.splice(cartItemIndex, 1);
    const cartTotal = await updateCartTotal(user);

    res
      .status(200)
      .json({
        message: "Product removed from cart successfully",
        cart: user.cart,
        cartTotal,
      });
  } catch (error) {
    next(createHttpError(500, "Server Error"));
  }
};

// Decrease Cart Item Quantity
export const decreaseCartItemQuantity = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  const { productId, color, size } = req.body;
  const userId = req.user?._id;

  try {
    const user = await findUserById(userId, next);
    if (!user) return;

    const cartItemIndex = user.cart.findIndex(
      (item) =>
        item.product.toString() === productId &&
        item.color === color &&
        item.size === size,
    );
    if (cartItemIndex === -1) {
      return next(createHttpError(404, "Product not found in cart"));
    }

    if (user.cart[cartItemIndex].quantity > 1) {
      user.cart[cartItemIndex].quantity -= 1;
    } else {
      user.cart.splice(cartItemIndex, 1);
    }

    const cartTotal = await updateCartTotal(user);

    res
      .status(200)
      .json({
        message: "Cart item quantity decreased successfully",
        cart: user.cart,
        cartTotal,
      });
  } catch (error) {
    next(createHttpError(500, "Server Error"));
  }
};

// Increase Cart Item Quantity
export const increaseCartItemQuantity = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  const { productId, color, size } = req.body;
  const userId = req.user?._id;

  try {
    const user = await findUserById(userId, next);
    if (!user) return;

    const cartItemIndex = user.cart.findIndex(
      (item) =>
        item.product.toString() === productId &&
        item.color === color &&
        item.size === size,
    );
    if (cartItemIndex === -1) {
      return next(createHttpError(404, "Product not found in cart"));
    }

    user.cart[cartItemIndex].quantity += 1;
    const cartTotal = await updateCartTotal(user);

    res
      .status(200)
      .json({
        message: "Cart item quantity increased successfully",
        cart: user.cart,
        cartTotal,
      });
  } catch (error) {
    next(createHttpError(500, "Server Error"));
  }
};

// Send OTP (via SMS or Email)
export const sendOtp = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  const userId = req.user._id;
  const { type } = req.body; // "SMS" or "EMAIL"

  if (!type || !["SMS", "EMAIL"].includes(type)) {
    return next(createHttpError(400, "OTP type must be SMS or EMAIL"));
  }

  try {
    const user = await findUserById(userId, next);
    if (!user) return;

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otp;
    user.otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    user.otpType = type;
    await user.save();

    // TODO: Integrate Alpha SMS API for SMS type
    // TODO: Integrate email sending for EMAIL type
    // For now, return OTP in response (remove in production)
    res.status(200).json({
      message: `OTP sent via ${type}`,
      otp: process.env.NODE_ENV === "DEVELOPMENT" ? otp : undefined,
    });
  } catch (error) {
    next(createHttpError(500, "Server Error"));
  }
};

// Verify OTP
export const verifyOtp = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  const userId = req.user._id;
  const { otp } = req.body;

  if (!otp) {
    return next(createHttpError(400, "OTP is required"));
  }

  try {
    const user = await findUserById(userId, next);
    if (!user) return;

    if (!user.otp || !user.otpExpires) {
      return next(createHttpError(400, "No OTP request found. Please request a new one."));
    }

    if (new Date() > user.otpExpires) {
      user.otp = undefined;
      user.otpExpires = undefined;
      await user.save();
      return next(createHttpError(400, "OTP has expired. Please request a new one."));
    }

    if (user.otp !== otp) {
      return next(createHttpError(400, "Invalid OTP"));
    }

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    user.otpType = undefined;
    await user.save();

    res.status(200).json({ message: "Account verified successfully" });
  } catch (error) {
    next(createHttpError(500, "Server Error"));
  }
};

export const addRatingAndComment = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  const { productId, orderProductId, rating, comment, orderId } = req.body;
  const userId: any = req.user._id;
  const postBy = userId;

  try {
    // Check if the user has purchased the product
    const hasPurchased = await Order.findOne({ _id: orderId });

    const isOrderExist: any = hasPurchased?.products.filter(
      (item) =>
        item.product.toString() === productId &&
        item._id.toString() === orderProductId,
    );

    if (!hasPurchased || isOrderExist.length === 0) {
      return next(
        createHttpError(403, "You must purchase the product to rate/comment"),
      );
    }

    if (hasPurchased.status !== "DELIVERED") {
      return res.status(400).json({ message: "Order is not complete yet" });
    }

    // Fetch the product
    const product = await Product.findById(productId);

    if (!product) {
      return next(createHttpError(404, "Product not found"));
    }

    // Check if the user has already rated or commented on the product
    const hasRatedOrCommented = product.productRatings.some(
      (item: any) => item.orderProductId.toString() === orderProductId,
    );

    if (hasRatedOrCommented) {
      return next(
        createHttpError(
          403,
          "You can only rate/comment on the product once per purchase",
        ),
      );
    }

    // Add the rating and comment to the product
    product.productRatings.push({ rating, comment, orderProductId, postBy });
    product.productTotalRating += rating;

    // Save the updated product
    await product.save();

    res.status(200).json({ message: "Rating and comment added successfully" });
  } catch (error) {
    next(createHttpError(500, "Server Error"));
  }
};
