import { Router } from "express";
import {
  getCsvProducts,
  getXmlProducts,
} from "../integrations/supplier-adapter.js";

const router = Router();

// GET /api/import/csv            → only the products
// GET /api/import/csv?debug=true → every intermediate step, so you can see them in Insomnia
router.get("/csv", async (req, res) => {
  const result = await getCsvProducts();

  if (req.query.debug) {
    res.json(result);
  } else {
    res.json({
      products: result.products,
      skipped: result.skipped,
    });
  }
});

router.get("/xml", async (req, res) => {
  const result = await getXmlProducts();

  if (req.query.debug) {
    res.json(result);
  } else {
    res.json({
      products: result.products,
      skipped: result.skipped,
    });
  }
});

export default router;
