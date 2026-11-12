/// <reference path="../express.d.ts" />

import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// Same as authenticateJWT, but guests are allowed through.
// If the cookie has a valid token req.user is set, otherwise req.user stays empty.
export function optionalJWT(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.token;

  if (!token) {
    return next();
  }

  jwt.verify(token, process.env.JWT_SECRET!, (err: unknown, user: unknown) => {
    if (!err) {
      req.user = user as Express.Request["user"];
    }
    next();
  });
}
