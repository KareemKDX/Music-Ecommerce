import { Router } from "express";
import { pool } from "../mysql-database";
import { authenticateJWT } from "../authentication/authenticateJWT";

const cartRouter = Router();

//Hämta kart via userID

cartRouter.get("/", authenticateJWT, async (req, res) => {
  try {
    //Tillfälligt ID tills user funktionalitet implementeras
    const userId = req.user!.userId;

    const [rows] = await pool.execute(
      `
      SELECT 
        cart_items.id,
        cart_items.product_id,
        cart_items.quantity,
        products.name,
        products.price
      FROM carts
      JOIN cart_items ON carts.id = cart_items.cart_id
      JOIN products ON cart_items.product_id = products.id
      WHERE carts.user_id = ?
      `,
      [userId],
    );

    res.json(rows);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Kunde inte hämta varukorgen",
    });
  }
});

//Lägg till produkt

cartRouter.post("/", authenticateJWT, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const { productId } = req.body;

    // Kolla users varukorg
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

    const cartId = cartRows[0].id;

    // Kolla om samma produkt redan finns i korgen
    const [items] = await pool.execute(
      `SELECT id, quantity
       FROM cart_items
       WHERE cart_id = ? AND product_id = ?`,
      [cartId, productId],
    );

    const itemRows = items as {
      id: number;
      quantity: number;
    }[];

    if (itemRows.length > 0) {
      //Om produkt finns öka antal
      await pool.execute(
        `UPDATE cart_items
         SET quantity = quantity + 1
         WHERE id = ?`,
        [itemRows[0].id],
      );
    } else {
      // Om inte finns lägg till ny produkt
      await pool.execute(
        `INSERT INTO cart_items (cart_id, product_id, quantity)
         VALUES (?, ?, ?)`,
        [cartId, productId, 1],
      );
    }

    res.status(201).json({
      message: "Produkten lades till i varukorgen",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Kunde inte lägga till produkten i varukorgen",
    });
  }
});

//Delete

cartRouter.delete("/:productId", authenticateJWT, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const productId = Number(req.params.productId);

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

    const cartId = cartRows[0].id;

    await pool.execute(
      `DELETE FROM cart_items
       WHERE cart_id = ? AND product_id = ?`,
      [cartId, productId],
    );
    res.json({
      message: "Produkten togs bort från varukorgen",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Kunde inte ta bort produkten från varukorgen",
    });
  }
});

export default cartRouter;
