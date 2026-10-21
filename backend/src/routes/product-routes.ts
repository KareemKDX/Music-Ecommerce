import { Router } from "express";
import { pool } from "../mysql-database";
import { authenticateJWT } from "../authentication/authenticateJWT";
import { indexProducts, removeProducts } from "../integrations/search-adapter";
import { Product } from "../types/Product";
import { error } from "node:console";

const productRouter = Router();

//HÄMTAR ALLA
productRouter.get("/", async (req, res) => {
  try {
    const [rows] = await pool.execute("SELECT * FROM products");
    console.log("Hämtade produkter:", rows);
    const products = rows as Product[];
    res.json(products);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Kunde inte hämta produkter",
    });
  }
});

//GET PRODUCT BY ID

productRouter.get("/:id", async (req, res) => {
  try {
    const [rows] = await pool.execute("SELECT * FROM products WHERE id = ?", [
      req.params.id,
    ]);
    res.json(rows);
  } catch (error) {
    console.error(error);

    res.status(500).json({ message: "Kunde inte hämta produkten" });
  }
});

//POST NEW PRODUCT

productRouter.post("/", authenticateJWT, async (req, res) => {
  try {
    const { name, description, price, image } = req.body;
    const productImage = image || "product-placeholder.jpg";

    // 1. Spara i databasen först
    const [result] = await pool.execute(
      `INSERT INTO products (name, description, price, image)
       VALUES (?, ?, ?, ?)`,
      [name, description, price, image, productImage],
    );

    // 2. Ge produkten ett artikelnummer baserat på det nya id:t
    const newId = (result as any).insertId;
    const sku = "SPX-" + newId;

    await pool.execute("UPDATE products SET sku = ? WHERE id = ?", [
      sku,
      newId,
    ]);

    // UPDATE ALGOLIA
    let searchIndexed = true;

    try {
      await indexProducts([
        {
          id: newId,
          sku: sku,
          name: name,
          description: description,
          price: Number(price),
          image: image,
        },
      ]);
    } catch (err) {
      console.warn("Could not index the new product:", err);
      searchIndexed = false;
    }

    res.status(201).json({
      message: "Produkten har skapats",
      result,
      searchIndexed,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Kunde inte skapa produkten",
    });
  }
});

//EDIT PRODUCT

productRouter.put("/:id", authenticateJWT, async (req, res) => {
  try {
    const { name, description, price, image } = req.body;

    await pool.execute(
      `UPDATE products
       SET name = ?, description = ?, price = ?, image = ?
       WHERE id = ?`,
      [name, description, price, image, req.params.id],
    );

    res.json({
      message: "Produkten har uppdaterats",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Kunde inte uppdatera produkten",
    });
  }
});

//DELETE PRODUCT
productRouter.delete("/:id", authenticateJWT, async (req, res) => {
  try {
    const [rows] = await pool.execute("SELECT sku FROM products WHERE id = ?", [
      req.params.id,
    ]);
    const found = rows as { sku: string | null }[];

    if (found.length === 0) {
      return res.status(404).json({ message: "Produkten finns inte" });
    }

    const sku = found[0].sku;

    // REMOVE FROM DB FIRST
    await pool.execute("DELETE FROM products WHERE id = ?", [req.params.id]);

    // REMOVE FROM AGOLIA AFTER.
    let searchIndexed = true;

    if (sku !== null) {
      try {
        await removeProducts([sku]);
      } catch (err) {
        console.warn("Could not remove from the search index:", err);
        searchIndexed = false;
      }
    }

    res.json({
      message: "Product removed",
      searchIndexed,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Error deleting product",
    });
  }
});

export default productRouter;
