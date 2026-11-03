/// <reference path="../express.d.ts" />

import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// Same as authenticateJWT, but guests are allowed through.
// If the token is valid req.user is set, otherwise req.user stays empty.
export function optionalJWT(req: Request, res: Response, next: NextFunction) {
  const token = req.header("Authorization");

  if (!token) {
    return next();
  }

  jwt.verify(token.split(" ")[1], process.env.JWT_SECRET!, (err, user) => {
    if (!err) {
      req.user = user as Express.Request["user"];
    }
    next();
  });
}
