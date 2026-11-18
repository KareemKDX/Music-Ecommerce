// Adapter for sending e-mail with Resend. The ONLY file that knows Resend's address and key.
// Docs: https://resend.com/docs/api-reference/emails/send-email
//       https://resend.com/docs/api-reference/errors
import { z } from "zod";

// Read the .env values when they are needed (not when the file is imported),
// so the rest of the server still starts even if Resend isn't configured yet.
function getConfig() {
  const apiKey = process.env.RESEND_API_KEY ?? "";
  const from = process.env.EMAIL_FROM ?? ""; // e.g. Spexah Instruments <onboarding@resend.dev>

  if (!apiKey || !from) {
    throw new Error(
      "Resend is not configured. Fill in RESEND_API_KEY and EMAIL_FROM in .env.",
    );
  }

  return { apiKey, from };
}

// What we expect from Resend – validated with Zod before we use it
const ResendAnswer = z.object({
  id: z.string(), // Resend's id for the e-mail – you find it under Emails in Resend
});

export type Email = {
  to: string;
  subject: string;
  html: string;
  text: string; // the same content without HTML – for e-mail programs that don't show HTML, and for spam filters
  // The same key twice (within 24 h) → Resend sends the e-mail only ONCE.
  // Tied to the order, e.g. order-confirmation/42, so a repeated Stripe webhook can't send a second e-mail.
  // Docs: https://resend.com/docs/api-reference/emails/send-email#param-idempotency-key
  idempotencyKey: string;
};

export async function sendEmail({
  to,
  subject,
  html,
  text,
  idempotencyKey,
}: Email): Promise<string> {
  const { apiKey, from } = getConfig();

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`, // the shop's own key – no user logs in
      "Content-Type": "application/json",
      "Idempotency-Key": idempotencyKey,
    },
    body: JSON.stringify({ from, to, subject, html, text }),
    signal: AbortSignal.timeout(5_000),
  });

  if (!response.ok) {
    // Resend's error answer has a message – but don't crash if the body isn't JSON
    const error = (await response.json().catch(() => ({}))) as {
      message?: string;
    };
    throw new Error(
      `Resend answered ${response.status}: ${error.message ?? "unknown error"}`,
    );
  }

  const answer = ResendAnswer.safeParse(await response.json());
  if (!answer.success) {
    throw new Error("Resend's answer is not valid");
  }

  return answer.data.id;
}
