/// <reference path="../express.d.ts" />

import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// Reads the JWT from the httpOnly cookie "token" (set in lib/auth-cookie.ts)
export function authenticateJWT(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const token = req.cookies?.token;

  if (!token) {
    return res.status(401).json({
      error: "Unauthorized",
    });
  }

  jwt.verify(token, process.env.JWT_SECRET!, (err: unknown, user: unknown) => {
    if (err) {
      return res.status(403).json({
        error: "Forbidden",
      });
    }

    req.user = user as Express.Request["user"];
    next();
  });
}
