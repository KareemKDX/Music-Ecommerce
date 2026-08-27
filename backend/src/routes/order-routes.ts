import { Router } from "express";
import { pool } from "../mysql-database";
import { authenticateJWT } from "../authentication/authenticateJWT";

interface Order {
  id: number;
  user_id: number;
  status: string;
  created_at: string;
  shipping_address: string;
  items: OrderItem[];
}

interface OrderItem {
  id: number;
  product_id: number;
  quantity: number;
  price: number;
  product_name: string;
}

const orderRouter = Router();

orderRouter.post("/", authenticateJWT, async (req, res) => {
  try {
    const userId = req.user!.userId; // TEMPORARY SOLUTION. CUSTOMER WITH ID 4
    const { shippingAddress } = req.body;

    if (!shippingAddress) {
      return res.status(400).json({
        message: "Address has to be filled in",
      });
    }

    //  FETCH USER CART
    const [carts] = await pool.execute(
      "SELECT id FROM carts WHERE user_id = ?",
      [userId],
    );

    const cartRows = carts as { id: number }[];

    if (cartRows.length === 0) {
      return res.status(404).json({
        message: "Ingen varukorg hittades",
      });
    }

    const [cart] = cartRows;
    const cartId = cart.id;

    // GET ALL PRODUCTS FROM CART
    const [items] = await pool.execute(
      `
      SELECT
        cart_items.product_id,
        cart_items.quantity,
        products.price,
        products.name
      FROM cart_items
      JOIN products
      ON cart_items.product_id = products.id
      WHERE cart_items.cart_id = ?
      `,
      [cartId],
    );

    const cartItems = items as {
      product_id: number;
      quantity: number;
      name: string;
      price: number;
    }[];

    if (cartItems.length === 0) {
      return res.status(400).json({
        message: "Varukorgen är tom",
      });
    }

    // CREATE ORDER TO DATABASE (INSERT)
    const [orderResult] = await pool.execute(
      `
      INSERT INTO orders (
        user_id,
        status,
        shipping_address
        )
        VALUES (?, ?, ?)
      `,
      [userId, "Ordered", shippingAddress],
    );

    const orderId = (orderResult as { insertId: number }).insertId;

    // CREATE ORDER_ITEMS TO DATABASE (INSERT)
    for (const item of cartItems) {
      await pool.execute(
        `
        INSERT INTO order_items (
          order_id,
          product_id,
          product_name,
          quantity,
          price
          )
          VALUES (?, ?, ?, ?, ?)
        `,
        [orderId, item.product_id, item.name, item.quantity, item.price],
      );
    }

    // REMOVE CART AFTER ORDER IS CREATED
    await pool.execute("DELETE FROM cart_items WHERE cart_id = ?", [cartId]);

    res.status(201).json({
      message: "Order skapad",
      orderId,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Kunde inte skapa order",
    });
  }
});

//ADMIN ROUTES

//GET ALL ORDERS WITH ORDER BY DATE TO SORT WITH LATEST
orderRouter.get("/gettestorder", authenticateJWT, async (req, res) => {
  try {
    const [orders] = await pool.execute(`
     SELECT
        orders.id,
        orders.user_id,
        orders.status,
        orders.shipping_address,
        orders.created_at
      FROM orders
      ORDER BY orders.created_at DESC
    `);

    res.json(orders);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Kunde inte hämta orders",
    });
  }
});

orderRouter.get("/", authenticateJWT, async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT
        orders.id AS order_id,
        orders.user_id,
        orders.status,
        orders.created_at,
        orders.shipping_address,

        order_items.id AS item_id,
        order_items.product_id,
        order_items.price,
        order_items.quantity,
        order_items.product_name,

        products.name AS product_name

      FROM orders

      LEFT JOIN order_items
        ON orders.id = order_items.order_id

      LEFT JOIN products
        ON order_items.product_id = products.id

      ORDER BY orders.created_at DESC
    `);

    //USE ORDER, ORDERITEMS INTERFACE TO BUILD AN EASIER JSON RESPONSE TO FRONTEND
    const orders: Order[] = [];

    for (const row of rows as any[]) {
      let order: Order | undefined = orders.find(
        (order) => order.id === row.order_id,
      );

      if (!order) {
        order = {
          id: row.order_id,
          user_id: row.user_id,
          status: row.status,
          created_at: row.created_at,
          shipping_address: row.shipping_address,
          items: [],
        };

        orders.push(order);
      }

      if (row.item_id) {
        order.items.push({
          id: row.item_id,
          product_id: row.product_id,
          price: row.price,
          quantity: row.quantity,
          product_name: row.product_name,
        });
      }
    }

    res.json(orders);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Could not fetch orders",
    });
  }
});

//EDIT ORDER STATUS BY ID
orderRouter.put("/:id", authenticateJWT, async (req, res) => {
  try {
    const { status } = req.body;

    await pool.execute(
      `
      UPDATE orders
      SET status = ?
      WHERE id = ?
      `,
      [status, req.params.id],
    );

    res.json({
      message: "Status updated",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Error updating order status",
    });
  }
});

//GET PRODUCTS FROM ORDER BY ID (UNUSED USED ATM)
orderRouter.get("/:id/items", authenticateJWT, async (req, res) => {
  try {
    const [items] = await pool.execute(
      `
      SELECT *
      FROM order_items
      WHERE order_id = ?
      `,
      [req.params.id],
    );

    res.json(items);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Kunde inte hämta order items",
    });
  }
});

export default orderRouter;
