import { randomUUID } from "node:crypto";
import { Router } from "express";
import { z } from "zod";
import {
  createEmbeddedCheckout,
  createHostedCheckout,
  type CheckoutItem,
} from "../integrations/payment-adapter";
import { pool } from "../mysql-database";
import { authenticateJWT } from "../authentication/authenticateJWT";

const router = Router();

// React only sends WHAT the customer wants to buy – never the price.
// The expected request body:
//   {
//     "items": [
//       { "sku": "LEV-1001", "quantity": 1 },
//       { "sku": "LEV-1003", "quantity": 2 }
//     ]
//   }

// Zod validation: make sure the recieved data is an array with objects,
// every object has "sku: string" and "quantity: number"
const Cart = z.object({});

// Create CartType out of zod validation
type CartType = z.infer<typeof Cart>;

// The cart → an order with OUR prices, saved as 'pending' BEFORE the customer pays.
function createOrder(cart: CartType) {
  // 1. In your shop: for each item React sent, fetch the product from the DB by its sku.
  //    The name and the price come from DB – never from React:
  //    - No product with that sku → answer 400
  //    - stock is lower than quantity → answer 400 (sold out)
  // In this example the products are hardcoded instead (same as the cart in React->App.tsx):
  const items: CheckoutItem[] = [
    { name: "Hoodie Svart", price: 599, quantity: 1 },
    { name: "T-shirt Vit", price: 199, quantity: 2 },
  ];
  console.log("\n[ORDER] Cart from React:", cart.items);

  // 2. In your shop: save the order in the DB as 'pending':
  // The webhook later uses these rows to mark the order as paid and lower the stock.
  const orderId = randomUUID(); // in your shop: the id the DB gives the order
  console.log("[ORDER] Created (pending):", orderId, items);

  return { orderId, items };
}

/* --- HOSTED: POST /api/checkout/hosted  { items: [{ sku, quantity }] } → { url } --- */
router.post("/hosted", authenticateJWT, async (req, res) => {
  const userId = req.user!.userId;
  const { shippingAddress } = req.body;

  if (!shippingAddress || typeof shippingAddress !== "string") {
    res.status(400).json({ error: "Address has to be filled in" });
    return;
  }

  // FETCH CART AND NEEDED INFO FROM DB
  const [rows] = await pool.execute(
    `SELECT cart_items.product_id, cart_items.quantity,
            products.name, products.price, products.stock
     FROM carts
     JOIN cart_items ON cart_items.cart_id = carts.id
     JOIN products ON cart_items.product_id = products.id
     WHERE carts.user_id = ?`,
    [userId],
  );
  const cartItems = rows as any[];

  if (cartItems.length === 0) {
    res.status(400).json({ error: "The cart is empty" });
    return;
  }

  // CHECK STOCK VALUE IS MORE THAN ADDED ITEMS
  for (const item of cartItems) {
    if (item.stock < item.quantity) {
      res
        .status(400)
        .json({ error: item.name + " does not have enough stock" });
      return;
    }
  }

  // SAVE ORDER AND MARK AS 'PAID' IN DB
  const connection = await pool.getConnection();
  let orderId = 0;

  try {
    await connection.beginTransaction();

    const [orderResult] = await connection.execute(
      "INSERT INTO orders (user_id, status, payment_status, shipping_address) VALUES (?, 'Ordered', 'unpaid', ?)",
      [userId, shippingAddress],
    );
    orderId = (orderResult as { insertId: number }).insertId;

    for (const item of cartItems) {
      await connection.execute(
        "INSERT INTO order_items (order_id, product_id, product_name, quantity, price) VALUES (?, ?, ?, ?, ?)",
        [orderId, item.product_id, item.name, item.quantity, item.price],
      );
    }

    await connection.commit();
  } catch (err) {
    await connection.rollback();
    console.error(err);
    res.status(500).json({ error: "Could not create the order" });
    return;
  } finally {
    connection.release();
  }

  // CREATE STRIPE SESSION. IF NO PAYMENT LEAVE AS UNPAID
  const checkoutItems: CheckoutItem[] = [];
  for (const item of cartItems) {
    checkoutItems.push({
      name: item.name,
      price: Number(item.price),
      quantity: item.quantity,
    });
  }

  try {
    const checkout = await createHostedCheckout(String(orderId), checkoutItems);

    await pool.execute("UPDATE orders SET stripe_session_id = ? WHERE id = ?", [
      checkout.sessionId,
      orderId,
    ]);

    res.json({ url: checkout.url });
  } catch (err) {
    console.error("Could not create the Stripe Checkout Session:", err);
    res.status(502).json({
      error: "The payment service is not responding. Try again later.",
    });
  }
});

/* --- EMBEDDED: POST /api/checkout/embedded  { items: [{ sku, quantity }] } → { clientSecret } --- */
router.post("/embedded", async (req, res) => {
  // 1. Validate the cart
  const cart = Cart.safeParse(req.body);
  if (!cart.success) {
    res
      .status(400)
      .json({ error: "Invalid cart", details: z.prettifyError(cart.error) });
    return;
  }

  // 2. Create the order with OUR prices
  const order = createOrder(cart.data);

  // 3. Create the Checkout Session at Stripe – with ui_mode: 'embedded_page'
  try {
    const checkout = await createEmbeddedCheckout(order.orderId, order.items);

    // 4. Save the session id on the order – crucial, the same as hosted. In your shop:
    //      UPDATE orders SET stripe_session_id = $1 WHERE id = $2

    // 5. Answer with the client secret, so React can show Stripe's form
    res.json({ clientSecret: checkout.clientSecret });
  } catch (err) {
    console.error("Could not create the Stripe Checkout Session:", err);
    res.status(502).json({
      error: "The payment service is not responding. Try again later.",
    });
  }
});

export default router;
