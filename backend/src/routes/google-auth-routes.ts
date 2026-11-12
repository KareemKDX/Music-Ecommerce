import { Router, type CookieOptions } from "express";
import jwt from "jsonwebtoken";
import { exchangeCode, getAuthorizeUrl } from "../integrations/google-adapter";
import { randomString, toCodeChallenge } from "../lib/pkce";
import { setAuthCookie } from "../lib/auth-cookie";
import { pool } from "../mysql-database";
import { mergeGuestCart } from "../services/cart-service";

// LOG IN WITH GOOGLE (mounted at /api/auth/google in server.ts)
//
// 1. GET  /api/auth/google            React links here → we send the user to Google
// 2. GET  /api/auth/google/callback   Google sends the user back → we find/create the customer
//                                     and send them to React with a one-time login code
// 3. POST /api/auth/google/exchange   React sends the login code → we set the shop's normal
//                                     httpOnly login cookie (same as email/password login)
//
// Why step 3? The login cookie has to be set by a request FROM the React app, otherwise
// browsers save it for the wrong site (frontend and backend are on different domains).

const googleAuthRouter = Router();

// Cookies for ONE login. The browser is on the backend's own domain during the
// redirects, so these cookies work even though React is on another domain.
// httpOnly: JavaScript can't read them. sameSite 'lax': they ARE sent when Google
// sends the user back to us (a normal navigation). secure: only over https (Vercel).
const FLOW_COOKIE: CookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  path: "/api/auth/google",
  maxAge: 10 * 60 * 1000, // 10 minutes
};

const LOGIN_CODE_SECONDS = 60;

type User = { id: number; email: string; is_admin: number };

// Where the React app lives (without a / at the end)
function clientUrl() {
  return (process.env.CLIENT_URL ?? "").replace(/\/$/, "");
}

// Only links inside our own site, same rule as in CustomerLogin.tsx
function safeRedirect(value: unknown) {
  return typeof value === "string" &&
    value.startsWith("/") &&
    !value.startsWith("//")
    ? value
    : "/";
}

// Back to the React login page with an error that the page can show
function loginError(error: string) {
  return `${clientUrl()}/login?error=${error}`;
}

// The customer is recognized by Google's id (sub) – NEVER by email.
// Accounts are not merged just because the email is the same.
async function findOrCreateGoogleUser(
  sub: string,
  email: string,
  name: string,
): Promise<User | "admin" | "email-exists"> {
  // 1. Has logged in with Google before → same customer
  const [googleRows] = await pool.execute(
    `SELECT id, email, is_admin FROM users WHERE google_id = ?`,
    [sub],
  );
  const googleUser = (googleRows as User[])[0];
  if (googleUser) {
    return googleUser.is_admin === 1 ? "admin" : googleUser;
  }

  // 2. The email already belongs to another account (password account or admin) → refuse.
  //    The email column is unique, so we couldn't create a second account anyway.
  const [emailRows] = await pool.execute(
    `SELECT id, is_admin FROM users WHERE email = ?`,
    [email],
  );
  const emailUser = (emailRows as { id: number; is_admin: number }[])[0];
  if (emailUser) {
    return emailUser.is_admin === 1 ? "admin" : "email-exists";
  }

  // 3. First Google login → new customer with sub, email and name
  const [result] = await pool.execute(
    `INSERT INTO users (username, email, password, google_id, is_admin) VALUES (?, ?, NULL, ?, 0)`,
    [name.slice(0, 100), email, sub],
  );
  return { id: (result as { insertId: number }).insertId, email, is_admin: 0 };
}

/* --- 1. START: GET /api/auth/google?redirect=/order&cartToken=… → the user is sent to Google --- */
googleAuthRouter.get("/", (req, res) => {
  const state = randomString();
  const codeVerifier = randomString();

  // Saved in httpOnly cookies, so we can use them when the user comes back from Google
  res.cookie("oauth_state", state, FLOW_COOKIE);
  res.cookie("oauth_verifier", codeVerifier, FLOW_COOKIE);
  res.cookie("oauth_redirect", safeRedirect(req.query.redirect), FLOW_COOKIE);
  if (typeof req.query.cartToken === "string" && req.query.cartToken) {
    res.cookie("oauth_cart", req.query.cartToken, FLOW_COOKIE);
  }

  try {
    res.redirect(getAuthorizeUrl(state, toCodeChallenge(codeVerifier)));
  } catch (err) {
    console.error(err);
    res.redirect(loginError("google"));
  }
});

/* --- 2. CALLBACK: GET /api/auth/google/callback?code=…&state=… – Google sends the user back here --- */
googleAuthRouter.get("/callback", async (req, res) => {
  const { code, state, error } = req.query;
  const expectedState = req.cookies.oauth_state;
  const codeVerifier = req.cookies.oauth_verifier;
  const redirect = safeRedirect(req.cookies.oauth_redirect);
  const cartToken = req.cookies.oauth_cart;

  // Used once – then thrown away
  res.clearCookie("oauth_state", FLOW_COOKIE);
  res.clearCookie("oauth_verifier", FLOW_COOKIE);
  res.clearCookie("oauth_redirect", FLOW_COOKIE);
  res.clearCookie("oauth_cart", FLOW_COOKIE);

  // The user clicked "Cancel" on Google
  if (error) {
    return res.redirect(loginError("cancelled"));
  }

  // Not the login WE started → stop (CSRF)
  if (
    typeof code !== "string" ||
    !expectedState ||
    !codeVerifier ||
    state !== expectedState
  ) {
    return res.redirect(loginError("google"));
  }

  try {
    const googleUser = await exchangeCode(code, codeVerifier);
    if (!googleUser.emailVerified) {
      return res.redirect(loginError("not-verified"));
    }

    const user = await findOrCreateGoogleUser(
      googleUser.sub,
      googleUser.email,
      googleUser.name,
    );
    if (user === "admin" || user === "email-exists") {
      return res.redirect(loginError(user));
    }

    // GIVE THE ACCOUNT THE CART THE CUSTOMER USED AS A GUEST (same as normal login)
    await mergeGuestCart(user.id, cartToken);

    // One-time login code: only valid for 60 seconds, and only says WHO logged in.
    // It is NOT Google's token and NOT our login token – React swaps it in step 3.
    const loginCode = jwt.sign(
      { userId: user.id },
      process.env.SESSION_TOKEN_SECRET!,
      { expiresIn: LOGIN_CODE_SECONDS },
    );

    const params = new URLSearchParams({ code: loginCode, redirect });
    res.redirect(`${clientUrl()}/auth/google?${params}`);
  } catch (err) {
    // Google didn't answer in time, answered with an error, or the database failed
    console.error(err);
    res.redirect(loginError("google"));
  }
});

/* --- 3. EXCHANGE: POST /api/auth/google/exchange { code } → login cookie + { user } --- */
googleAuthRouter.post("/exchange", async (req, res) => {
  let userId: number;
  try {
    const payload = jwt.verify(
      String(req.body?.code ?? ""),
      process.env.SESSION_TOKEN_SECRET!,
    ) as { userId: number };
    userId = payload.userId;
  } catch {
    // Wrong, changed or expired (older than 60 seconds) login code
    return res
      .status(401)
      .json({ message: "Login code is invalid or expired" });
  }

  try {
    const [rows] = await pool.execute(
      `SELECT id, email, is_admin FROM users WHERE id = ? AND is_admin = 0`,
      [userId],
    );
    const user = (rows as User[])[0];
    if (!user) {
      return res.status(401).json({ message: "Account not found" });
    }

    // Exactly the same as POST /api/customer/login
    setAuthCookie(res, user);
    res.json({ message: "Inloggning lyckades", user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Kunde inte logga in" });
  }
});

export default googleAuthRouter;
