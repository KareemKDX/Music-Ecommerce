// Adapter for "Log in with Google" (OAuth 2.0 + OpenID Connect). The ONLY file that knows Google's URLs,
// client id and client secret.
// Docs: https://developers.google.com/identity/openid-connect/openid-connect
import jwt from "jsonwebtoken";
import { z } from "zod";

// WHAT WE EXPECT FROM GOOGLE – validated with Zod before we use anything.
// Google's token answer: we only need the ID token
const TokenResponse = z.object({
  id_token: z.string(),
});

// The content (claims) of the ID token
const IdTokenClaims = z.object({
  iss: z.enum(["https://accounts.google.com", "accounts.google.com"]), // issued by Google
  aud: z.string(), // which app it is for – checked against our client id below
  exp: z.number(), // expires (seconds since 1970)
  sub: z.string().min(1), // Google's id for the user – never changes
  email: z.email(),
  email_verified: z.boolean(),
  name: z.string().optional(),
});

// Read the .env values when they are needed (not when the file is imported),
// so the rest of the server still starts even if Google isn't configured yet.
function getConfig() {
  const clientId = process.env.GOOGLE_CLIENT_ID ?? "";
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET ?? "";
  const callbackUrl = process.env.GOOGLE_CALLBACK_URL ?? "";

  if (!clientId || !clientSecret || !callbackUrl) {
    throw new Error(
      "Google is not configured. Fill in the GOOGLE_ values in .env (see .env.example).",
    );
  }

  return { clientId, clientSecret, callbackUrl };
}

/* --- 1. Where we send the user: Google's own login page --- */
export function getAuthorizeUrl(state: string, codeChallenge: string) {
  const { clientId, callbackUrl } = getConfig();

  const params = new URLSearchParams({
    response_type: "code", // Authorization Code flow
    client_id: clientId,
    scope: "openid email profile", // openid = we want an ID token. Only who the user is – nothing sensitive
    redirect_uri: callbackUrl, // must match an Authorized redirect URI in Google Cloud exactly
    state, // we check it in the callback → protects against CSRF
    code_challenge: codeChallenge, // PKCE: the hash of a secret only our server knows
    code_challenge_method: "S256", // PKCE
    prompt: "select_account", // always let the user pick which Google account to use
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

/* --- 2. The code from the callback → Google's ID token → who the user is --- */
// Server to server: the client secret never reaches the browser.
export async function exchangeCode(code: string, codeVerifier: string) {
  const { clientId, clientSecret, callbackUrl } = getConfig();

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      code_verifier: codeVerifier, // PKCE: Google hashes it and compares with code_challenge
      grant_type: "authorization_code",
      redirect_uri: callbackUrl,
    }),
    signal: AbortSignal.timeout(5_000),
  });
  if (!response.ok) {
    throw new Error(`Google refused the code: status ${response.status}`);
  }

  const answer = TokenResponse.safeParse(await response.json());
  if (!answer.success) {
    throw new Error("Google's token answer has no ID token");
  }

  // The ID token is a JWT – signed by Google. Paste it into jwt.io to see the payload.
  // We got it straight from Google over HTTPS, so we don't need to check the signature –
  // but we check that it was issued by Google (iss), to OUR app (aud), and hasn't expired (exp).
  // (We don't console.log the token: it says who the user is, and logs end up on Vercel.)
  const claims = IdTokenClaims.safeParse(jwt.decode(answer.data.id_token));
  if (!claims.success) {
    throw new Error("The ID token from Google is not valid");
  }
  if (claims.data.aud !== clientId) {
    throw new Error("The ID token is for another app");
  }
  if (claims.data.exp * 1000 < Date.now()) {
    throw new Error("The ID token has expired");
  }

  return {
    sub: claims.data.sub,
    email: claims.data.email.toLowerCase(),
    emailVerified: claims.data.email_verified,
    name: claims.data.name ?? claims.data.email,
  };
  // Google's access token (answer.access_token) isn't needed: everything we want is in the ID token.
}
