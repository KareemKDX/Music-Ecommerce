import type { CookieOptions, Response } from "express";
import jwt from "jsonwebtoken";

// THE SHOP'S OWN LOGIN – used by ALL login types (email/password, register, admin and Google).
// After login the user gets the same JWT in the same httpOnly cookie, so the rest of the
// backend (authenticateJWT / optionalJWT) never needs to know how the user logged in.

const TOKEN_HOURS = 2;
const isProduction = process.env.NODE_ENV === "production";

// httpOnly: JavaScript in the browser can't read the cookie → an XSS attack can't steal the token.
// Deployed, the shop and the API are on DIFFERENT domains (two Vercel projects), so the
// cookie has to be allowed between sites: sameSite "none" + secure (https only).
// partitioned: the browser keeps the cookie only for our shop (CHIPS), which makes browsers
// that block third-party cookies more willing to accept it.
// Locally, localhost:5173 and localhost:3000 count as the same site → "lax" over http works.
const AUTH_COOKIE: CookieOptions = {
  httpOnly: true,
  sameSite: isProduction ? "none" : "lax",
  secure: isProduction,
  partitioned: isProduction,
  path: "/",
};

type TokenUser = {
  id: number;
  email: string;
  is_admin?: number;
};

// The JWT itself: who the user is and if they are admin or customer
export function signToken(user: TokenUser) {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.is_admin === 1 ? "admin" : "customer",
    },
    process.env.JWT_SECRET!,
    { expiresIn: `${TOKEN_HOURS}h` },
  );
}

// LOG IN: put the JWT in the httpOnly cookie "token"
export function setAuthCookie(res: Response, user: TokenUser) {
  res.cookie("token", signToken(user), {
    ...AUTH_COOKIE,
    maxAge: TOKEN_HOURS * 60 * 60 * 1000, // milliseconds
  });
}

// LOG OUT: React can't remove an httpOnly cookie itself – the server has to.
// The options must be the same as when the cookie was set, otherwise the browser keeps it.
export function clearAuthCookie(res: Response) {
  res.clearCookie("token", AUTH_COOKIE);
}
