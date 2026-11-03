import { Router } from "express";
import { pool } from "../mysql-database";
import { optionalJWT } from "../authentication/optionalJWT";
import { findCartId, getOrCreateCart } from "../services/cart-service";

const cartRouter = Router();

// Works for both logged in users and guests.
// Logged in -> cart is found with the JWT. Guest -> cart is found with the X-Cart-Token header.

// FETCH CART
cartRouter.get("/", optionalJWT, async (req, res) => {
  try {
    const cartId = await findCartId(
      req.user?.userId,
      req.header("X-Cart-Token"),
    );

    // No cart yet = empty cart
    if (!cartId) {
      return res.json([]);
    }

    const [rows] = await pool.execute(
      `
      SELECT
        cart_items.id,
        cart_items.product_id,
        cart_items.quantity,
        products.name,
        products.price
      FROM cart_items
      JOIN products ON cart_items.product_id = products.id
      WHERE cart_items.cart_id = ?
      `,
      [cartId],
    );

    res.json(rows);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Could not fetch the cart",
    });
  }
});

// ADD PRODUCT
cartRouter.post("/", optionalJWT, async (req, res) => {
  try {
    const { productId } = req.body;

    const cart = await getOrCreateCart(
      req.user?.userId,
      req.header("X-Cart-Token"),
    );

    // IF PRODUCT IS ALREADY IN CART -> INCREASE, IF NOT -> ADD NEW
    await pool.execute(
      `INSERT INTO cart_items (cart_id, product_id, quantity)
       VALUES (?, ?, 1)
       ON DUPLICATE KEY UPDATE quantity = quantity + 1`,
      [cart.cartId, productId],
    );

    // So old guest carts can be cleaned up
    await pool.execute("UPDATE carts SET updated_at = NOW() WHERE id = ?", [
      cart.cartId,
    ]);

    res.status(201).json({
      message: "Product added to cart",
      // Only set when a new guest cart was made, the frontend saves it
      cartToken: cart.guestToken,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Could not add the product to the cart",
    });
  }
});

//DELETE PRODUCT BY ID
cartRouter.delete("/:productId", optionalJWT, async (req, res) => {
  try {
    const productId = Number(req.params.productId);

    const cartId = await findCartId(
      req.user?.userId,
      req.header("X-Cart-Token"),
    );

    if (!cartId) {
      return res.status(404).json({
        message: "No cart found",
      });
    }

    await pool.execute(
      `DELETE FROM cart_items
       WHERE cart_id = ? AND product_id = ?`,
      [cartId, productId],
    );
    res.json({
      message: "Product removed from cart",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Could not remove the product from the cart",
    });
  }
});

export default cartRouter;
