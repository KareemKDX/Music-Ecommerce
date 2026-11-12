import { Router } from "express";
import { optionalJWT } from "../authentication/optionalJWT";
import { clearAuthCookie } from "../lib/auth-cookie";

// ROUTES SHARED BY ALL LOGIN TYPES (email/password, admin and Google)
const authRouter = Router();

/* --- GET /api/auth/me → { user } or { user: null } --- */
// React can't read the httpOnly cookie, so it asks the server who is logged in.
// Answers 200 with user: null for guests, so a guest doesn't get an error in the console.
authRouter.get("/me", optionalJWT, (req, res) => {
  if (!req.user) {
    return res.json({ user: null });
  }

  res.json({
    user: {
      userId: req.user.userId,
      email: req.user.email,
      role: req.user.role,
    },
  });
});

/* --- POST /api/auth/logout → the cookie is removed --- */
authRouter.post("/logout", (_req, res) => {
  clearAuthCookie(res);
  res.json({ message: "Logged out" });
});

export default authRouter;
