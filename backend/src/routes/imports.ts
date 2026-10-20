import { Router } from "express";
import {
  getCsvProducts,
  getXmlProducts,
} from "../integrations/supplier-adapter.js";
import { saveProducts } from "../services/import-product-service.js";

const router = Router();

// GET /api/import/csv            → only the products
// GET /api/import/csv?debug=true → every intermediate step, so you can see them in Insomnia

router.get("/csv", async (req, res, next) => {
  try {
    const result = await getCsvProducts();

    if (req.query.debug) {
      res.json(result);
    } else {
      const report = await saveProducts(result.products, result.skipped);
      res.json({ ...report, products: result.products });
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
