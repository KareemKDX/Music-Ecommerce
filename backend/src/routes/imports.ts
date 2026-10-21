import { Router } from "express";
import {
  getCsvProducts,
  getXmlProducts,
} from "../integrations/supplier-adapter.js";
import { saveProducts } from "../services/import-product-service.js";
import { Product } from "../types/Product";
import { pool } from "../mysql-database";
import { indexProducts } from "../integrations/search-adapter";

const router = Router();

// GET /api/import/csv            → only the products
// GET /api/import/csv?debug=true → every intermediate step, so you can see them in Insomnia

router.get("/csv", async (req, res, next) => {
  try {
    const result = await getCsvProducts();

    if (req.query.debug) {
      res.json(result);
    } else {
      // SAVE IMPORT TO DATABASE
      const report = await saveProducts(result.products, result.skipped);

      // FETCH ALL PRODUCTS BACK FROM DB AND SAVE TO AGOLIA
      let searchIndexed = true;
      try {
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

        // 3.
        await indexProducts(products);
      } catch (err) {
        console.warn("Could not update the search index:", err);
        searchIndexed = false;
      }

      res.json({ ...report, products: result.products, searchIndexed });
    }
  } catch (err) {
    next(err);
  }
});
router.get("/xml", async (req, res) => {
  const result = await getXmlProducts();

  if (req.query.debug) {
    res.json(result);
  } else {
    const report = await saveProducts(result.products, result.skipped);

    res.json({ ...report, products: result.products });
  }
});

export default router;
