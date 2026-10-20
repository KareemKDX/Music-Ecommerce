import { Router } from "express";
import { pool } from "../mysql-database";
import jwt from "jsonwebtoken";
import { indexProducts } from "../integrations/search-adapter";
import { Product } from "../types/Product";

const adminRouter = Router();

adminRouter.post("/login", async (req, res) => {
  try {
    let email = req.body.email;
    let password = req.body.password;

    const [rows] = await pool.execute(
      `SELECT id, email
       FROM users
       WHERE email = ? AND password = ? AND is_Admin = true`,
      [email, password],
    );

    // TYPE
    const admins = rows as {
      id: number;
      email: string;
    }[];

    //IF NO FOUND
    if (admins.length === 0) {
      return res.status(401).json({
        message: "Fel email eller lösenord",
      });
    }

    const admin = admins[0];

    const token = jwt.sign(
      {
        userId: admin.id,
        email: admin.email,
        role: "admin",
      },
      process.env.JWT_SECRET!,
      {
        expiresIn: "2h",
      },
    );

    res.json({
      message: "Inloggning lyckades",
      admin: admins[0],
      token,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Kunde inte logga in",
    });
  }
});

//AGOLIA

adminRouter.post("/search/index", async (_req, res) => {
  try {
    // FETCH ALL PROODUCTS FROM DATABASE AND LOOP THROUGH THEM
    const [rows] = await pool.query(
      "SELECT id, sku, name, description, price, image FROM products WHERE sku IS NOT NULL",
    );

    const products: Product[] = [];
    for (const row of rows as any[]) {
      products.push({
        id: row.id,
        sku: row.sku,
        name: row.name,
        description: row.description,
        price: Number(row.price),
        image: row.image,
      });
    }

    // 2. Skicka dem till Algolia
    const indexed = await indexProducts(products);
    res.json({ indexed });
  } catch (err) {
    console.error("Could not send the products to Algolia:", err);
    res.status(502).json({
      error:
        "Could not send the products to the search service. Try again later.",
    });
  }
});

/* --- CREATE: POST /api/admin/products --- */
adminRouter.post("/products", async (req, res) => {
  const newProduct: Product = {
    sku: "LEV-1009",
    name: "Vit strumpor",
    category: "Strumpor",
    price: 29,
    stock: 33,
    description: "Mjuk strumpor i ekologisk bomull.",
  };

  try {
    // Remember that Algolia is to mirror what is saved in the products table in your DB. Make sure to do the following order when performing CRUD
    // 1. Save first in DB
    // 2. If all is well,  index the new product in Algolia.
    await indexProducts([newProduct]);
    res.status(201).json({ newProduct, searchIndexed: true });
  } catch (err) {
    console.warn("Could not index the new product to Algolia:", err);
    res.status(201).json({ newProduct, searchIndexed: false });
  }
});

/* --- UPDATE: PUT /api/admin/products/:sku --- */
adminRouter.put("/products/:sku", async (req, res) => {
  const updatedProduct: Product = {
    sku: req.params.sku, // e.g. LEV-1009, the product we created above
    name: "Vita strumpor - updated",
    category: "Strumpor",
    price: 39, // new price
    stock: 20, // new stock
    description: "Mjuka strumpor i ekologisk bomull.",
  };

  // Same order as for create:
  // 1. Update first in DB
  // 2. If all is well, update the product in Algolia.
  // It's the SAME call as for create: saveObjects is an upsert on objectID,
  // so the same sku replaces the old record instead of creating a new one.

  try {
    await indexProducts([updatedProduct]);
    res.json({ updatedProduct, searchIndexed: true });
  } catch (err) {
    console.warn("Could not index the updated product to Algolia:", err);
    res.json({ updatedProduct, searchIndexed: false });
  }
});

/* --- DELETE: DELETE /api/admin/products/:sku --- */
adminRouter.delete("/products/:sku", async (req, res) => {
  const deletedSku = req.params.sku; // e.g. LEV-1009

  // Same order as for create and update:
  // 1. Delete first in DB
  // 2. If all is well, remove the product from Algolia.
  // Otherwise the search still finds a product that no longer exists.
});

// Think about: what else changes a product? An order that lowers the stock?
// Then it also has to update Algolia – otherwise the search shows the wrong stock.

export default adminRouter;
