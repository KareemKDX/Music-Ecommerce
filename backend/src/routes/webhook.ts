import express, { Router } from "express";
import { pool } from "../mysql-database";
import { verifyWebhook } from "../integrations/payment-adapter";

const router = Router();

router.post(
  "/",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    // 1. Kontrollera att anropet kommer från Stripe
    const signature = req.headers["stripe-signature"];
    if (typeof signature !== "string") {
      res.status(400).send("Missing Stripe-Signature");
      return;
    }

    let event;
    try {
      event = verifyWebhook(req.body, signature);
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      res.status(400).send("Invalid signature");
      return;
    }

    console.log("[WEBHOOK] Event:", event.type, event.id);

    try {
      if (
        event.type === "checkout.session.completed" ||
        event.type === "checkout.session.async_payment_succeeded"
      ) {
        const session = event.data.object;

        if (session.payment_status === "paid") {
          const orderId = Number(session.client_reference_id);
          await markOrderAsPaid(orderId);
        }
      }

      if (event.type === "checkout.session.expired") {
        const session = event.data.object;
        const orderId = Number(session.client_reference_id);

        await pool.execute(
          "UPDATE orders SET payment_status = 'cancelled' WHERE id = ? AND payment_status = 'unpaid'",
          [orderId],
        );
        console.log("[WEBHOOK] Order cancelled (session expired):", orderId);
      }
    } catch (err) {
      // ANsWER WITH 500
      console.error("[WEBHOOK] Could not handle the event:", err);
      res.status(500).send("Webhook handler failed");
      return;
    }

    res.json({ received: true });
  },
);

async function markOrderAsPaid(orderId: number) {
  if (Number.isInteger(orderId) === false || orderId <= 0) {
    console.warn("[WEBHOOK] Invalid order id:", orderId);
    return;
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // MARK AS PAID IF ORDER IS UNPAID BEFORE
    const [updateResult] = await connection.execute(
      "UPDATE orders SET payment_status = 'paid' WHERE id = ? AND payment_status = 'unpaid'",
      [orderId],
    );

    if ((updateResult as any).affectedRows === 0) {
      await connection.commit();
      console.log("[WEBHOOK] Order already handled, skipping:", orderId);
      return;
    }

    // DEDUCT STOCK
    const [itemRows] = await connection.execute(
      "SELECT product_id, quantity FROM order_items WHERE order_id = ?",
      [orderId],
    );

    for (const item of itemRows as any[]) {
      await connection.execute(
        "UPDATE products SET stock = GREATEST(stock - ?, 0) WHERE id = ?",
        [item.quantity, item.product_id],
      );
    }

    // EMPTY CUSTOMER CART
    const [orderRows] = await connection.execute(
      "SELECT user_id FROM orders WHERE id = ?",
      [orderId],
    );
    const userId = (orderRows as any[])[0]?.user_id;

    if (userId !== undefined) {
      await connection.execute(
        "DELETE FROM cart_items WHERE cart_id IN (SELECT id FROM carts WHERE user_id = ?)",
        [userId],
      );
    }

    await connection.commit();
    console.log("[WEBHOOK] Order paid:", orderId);
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

export default router;
