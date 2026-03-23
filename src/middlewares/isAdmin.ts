import express from "express";
import jwt from "jsonwebtoken";
import createHttpError from "http-errors";
import { config } from "../config";
import User from "../../services/user/userModel";

const isAdmin = async (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
) => {
  try {
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
      return next(createHttpError(401, "Unauthorized"));
    }

    const decodedToken: any = jwt.verify(token, config.jwtSecret as string);
    const userId = decodedToken?._id || decodedToken?.sub;

    const user = await User.findById(userId);

    if (!user || user.roles !== "ADMIN") {
      return next(createHttpError(401, "Unauthorized"));
    }

    next();
  } catch (error: any) {
    return next(createHttpError(401, error));
  }
};

export { isAdmin };
