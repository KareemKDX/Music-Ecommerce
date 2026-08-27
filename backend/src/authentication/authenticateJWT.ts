/// <reference path="../express.d.ts" />

import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export function authenticateJWT(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const token = req.header("Authorization");

  if (!token) {
    return res.status(401).json({
      error: "Unauthorized",
    });
  }

  jwt.verify(token.split(" ")[1], process.env.JWT_SECRET!, (err, user) => {
    if (err) {
      return res.status(403).json({
        error: "Forbidden",
      });
    }

    req.user = user as Express.Request["user"];
    next();
  });
}
