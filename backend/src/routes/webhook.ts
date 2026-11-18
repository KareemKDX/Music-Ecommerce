import express, { Router } from "express";
import { pool } from "../mysql-database";
import { verifyWebhook } from "../integrations/payment-adapter";
import { sendEmail } from "../integrations/email-adapter";
import { orderConfirmation, type Order } from "../lib/order-confirmation";

const router = Router();

router.post(
  "/",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    // VERIFY STRIPE SIGNATURE
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
          const justPaid = await markOrderAsPaid(orderId);

          // SEND THE CONFIRMATION ONLY WHEN THE ORDER JUST BECAME PAID
          // (if Stripe sends the same webhook again, the order is already paid → no second e-mail)
          if (justPaid) {
            await sendOrderConfirmation(orderId);
          }
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

// Returns true if the order was changed to paid now, false if it was already handled
async function markOrderAsPaid(orderId: number): Promise<boolean> {
  if (Number.isInteger(orderId) === false || orderId <= 0) {
    console.warn("[WEBHOOK] Invalid order id:", orderId);
    return false;
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
      return false;
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
    return true;
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

// EMAIL CONFIRMATION. SENDS AFTER ORDER IS MARKED AS PAID
// A failed e-mail must NOT stop the order: the order is paid anyway. So this function
// never throws – it only logs the error, and the webhook still answers 200 to Stripe.
async function sendOrderConfirmation(orderId: number) {
  try {
    //Fetch order
    const [orderRows] = await pool.execute(
      `SELECT orders.id, orders.shipping_price, users.username, users.email
       FROM orders
       JOIN users ON users.id = orders.user_id
       WHERE orders.id = ?`,
      [orderId],
    );
    const orderRow = (
      orderRows as {
        id: number;
        shipping_price: number | null;
        username: string;
        email: string;
      }[]
    )[0];

    //return if no order found
    if (!orderRow) {
      console.warn("[EMAIL] No customer found for order:", orderId);
      return;
    }

    //Fetch all items connected to order by id
    const [itemRows] = await pool.execute(
      `SELECT product_name, quantity, price FROM order_items WHERE order_id = ?`,
      [orderId],
    );
    const items = (
      itemRows as { product_name: string; quantity: number; price: number }[]
    ).map((item) => ({
      title: item.product_name,
      quantity: Number(item.quantity),
      price: Number(item.price),
    }));

    const order: Order = {
      id: orderRow.id,
      name: orderRow.username,
      email: orderRow.email,
      items,
      shipping: Number(orderRow.shipping_price ?? 0),
    };

    const { subject, html, text } = orderConfirmation(order);

    // The key is tied to the ORDER: the same order can never get two confirmation e-mails
    const emailId = await sendEmail({
      to: order.email,
      subject,
      html,
      text,
      idempotencyKey: `order-confirmation/${order.id}`,
    });
    console.log(`[EMAIL] Sent "${subject}" – Resend id: ${emailId}`);
  } catch (err) {
    console.error("[EMAIL] Failed for order", orderId, err);
  }
}

export default router;
