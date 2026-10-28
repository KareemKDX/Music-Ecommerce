import { Router } from "express";
import { z } from "zod";
import { authenticateJWT } from "../authentication/authenticateJWT";
import {
  getEstimatedDelivery,
  getNearestServicePoints,
} from "../integrations/postnord-adapter";
import {
  calculateShipping,
  FREE_SHIPPING_FROM,
  getCartSubtotal,
  SHOP_POSTAL_CODE,
} from "../services/shipping-service";

const shippingRouter = Router();

export const PostalCode = z
  .string()
  .trim()
  .transform((value) => value.replace(/\s/g, "")) // "111 22" → "11122"
  .pipe(z.string().regex(/^\d{5}$/, "Postal code must be 5 digits"));

export const ShippingMethod = z.enum(["service_point", "home"]);

/* --- GET /api/shipping/service-points?postalCode=11122 → [ServicePoint] --- */
shippingRouter.get("/service-points", async (req, res) => {
  const postalCode = PostalCode.safeParse(req.query.postalCode);
  if (!postalCode.success) {
    res.status(400).json({ error: postalCode.error.issues[0].message });
    return;
  }

  try {
    res.json(await getNearestServicePoints(postalCode.data));
  } catch (err) {
    console.error("PostNord service points failed:", err);
    res.status(502).json({
      error:
        "Could not fetch service points from PostNord. You can still choose home delivery.",
    });
  }
});

/* --- POST /api/shipping/quote  { method, postalCode } → price + estimated delivery --- */
const QuoteRequest = z.object({
  method: ShippingMethod,
  postalCode: PostalCode,
});

shippingRouter.post("/quote", authenticateJWT, async (req, res, next) => {
  const quote = QuoteRequest.safeParse(req.body);
  if (!quote.success) {
    res.status(400).json({ error: quote.error.issues[0].message });
    return;
  }

  try {
    const subtotal = await getCartSubtotal(req.user!.userId);
    const shippingPrice = calculateShipping(quote.data.method, subtotal);

    // The delivery time is nice to have: if PostNord fails, the checkout still works.
    let estimatedDelivery: string | null = null;
    try {
      estimatedDelivery = await getEstimatedDelivery(
        SHOP_POSTAL_CODE,
        quote.data.postalCode,
        quote.data.method,
      );
    } catch (err) {
      console.error("PostNord transit time failed:", err);
    }

    res.json({
      subtotal,
      shippingPrice,
      total: subtotal + shippingPrice,
      freeShippingFrom: FREE_SHIPPING_FROM,
      estimatedDelivery,
    });
  } catch (err) {
    next(err);
  }
});

export default shippingRouter;
