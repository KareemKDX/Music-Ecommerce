import { Router } from "express";
import { pool } from "../mysql-database";
import { authenticateJWT } from "../authentication/authenticateJWT";

interface Order {
  id: number;
  user_id: number;
  status: string;
  created_at: string;
  shipping_address: string;
  shipping_method: "service_point" | "home" | null;
  shipping_price: number;
  postal_code: string | null;
  service_point_name: string | null;
  service_point_address: string | null;
  estimated_delivery: string | null;
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

// FIND CUSTOMER ORDER THROUGH STRIPE SESSION ID
orderRouter.get("/by-session", authenticateJWT, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const sessionId = req.query.session_id;

    if (typeof sessionId !== "string" || sessionId === "") {
      return res.status(400).json({ message: "session_id is required" });
    }

    // USER CAN ONLY SEE ITS OWN ORDER BY USERID AND SESSION ID
    const [orderRows] = await pool.execute(
      `SELECT id, payment_status, status, shipping_address, created_at,
              shipping_method, shipping_price, postal_code,
              service_point_name, service_point_address, estimated_delivery
       FROM orders
       WHERE stripe_session_id = ? AND user_id = ?`,
      [sessionId, userId],
    );

    const found = orderRows as any[];

    if (found.length === 0) {
      return res.status(404).json({ message: "Order not found" });
    }

    const order = found[0];

    const [itemRows] = await pool.execute(
      `SELECT id, product_name, quantity, price
       FROM order_items
       WHERE order_id = ?`,
      [order.id],
    );

    res.json({ ...order, items: itemRows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Could not fetch the order" });
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
        orders.shipping_method,
        orders.shipping_price,
        orders.postal_code,
        orders.service_point_name,
        orders.service_point_address,
        orders.estimated_delivery,

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
          shipping_method: row.shipping_method,
          shipping_price: Number(row.shipping_price),
          postal_code: row.postal_code,
          service_point_name: row.service_point_name,
          service_point_address: row.service_point_address,
          estimated_delivery: row.estimated_delivery,
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
