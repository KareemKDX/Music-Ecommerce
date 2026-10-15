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
  res.json(req.query.debug ? result : result.products);
});

router.get("/xml", async (req, res) => {
  const result = await getXmlProducts();
  res.json(req.query.debug ? result : result.products);
});

export default router;
