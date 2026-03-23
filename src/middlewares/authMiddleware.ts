import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import createHttpError from "http-errors";
import User from "../../services/user/userModel"; // Adjust the path as necessary
import { config } from "../config"; // Ensure you have your JWT secret and other configs here

interface AuthRequest extends Request {
  user?: any;
}

const authMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.headers.cookie && req.headers.cookie.startsWith("Bearer=")) {
    token = req.headers.cookie.split("=")[1];
  }
  if (!token) {
    return next(createHttpError(401, "Not authorized, no token"));
  }

  try {
    const decoded: any = jwt.verify(token, config.jwtSecret as string);
    const userID = decoded._id || decoded.sub;
    const user = await User.findById(userID);
    if (!user) {
      return next(createHttpError(404, "User not found"));
    }
    req.user = user;
    next();
  } catch (error) {
    return next(createHttpError(401, "Not authorized, token failed"));
  }
};

export default authMiddleware;
