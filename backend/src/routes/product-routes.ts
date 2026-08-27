import { Router } from "express";
import { pool } from "../mysql-database";
import { authenticateJWT } from "../authentication/authenticateJWT";

const productRouter = Router();

//HÄMTAR ALLA
productRouter.get("/", async (req, res) => {
  try {
    const [rows] = await pool.execute("SELECT * FROM products");
    console.log("Hämtade produkter:", rows);
    res.json(rows);
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
    const [result] = await pool.execute(
      `INSERT INTO products (name, description, price, image)
       VALUES (?, ?, ?, ?)`,
      [name, description, price, image],
    );

    res.status(201).json({ message: "Produkten har skapats", result });
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

//REMOVE PRODUCT

productRouter.delete("/:id", authenticateJWT, async (req, res) => {
  try {
    await pool.execute("DELETE FROM products WHERE id = ?", [req.params.id]);

    res.json({
      message: "Produkten har tagits bort",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Kunde inte ta bort produkten",
    });
  }
});

export default productRouter;
