import { Router } from "express";
import { z } from "zod";
import { searchProducts } from "../integrations/search-adapter";

const router = Router();

// Here we validate data from the USER before sending it on to another system.
const SearchQuery = z.object({
  q: z.string().max(100).default(""),
  page: z.coerce.number().int().min(1).default(1), // '2' => 2
  pageSize: z.coerce.number().int().min(1).max(50).default(10), // max '50' => 50
});

// GET /api/search?q=hoodie → search in Algolia
router.get("/", async (req, res) => {
  // VALIDATE PARAMS
  const result = SearchQuery.safeParse(req.query);
  if (!result.success) {
    res.status(400).json({
      error: "Invalid search parameters",
      details: z.prettifyError(result.error),
    });
    return;
  }

  const { q, page, pageSize } = result.data;

  // ADAPTER SEARCHES AND ANSWERS IN OUR MODEL
  try {
    const searchResult = await searchProducts(q, page, pageSize);
    res.json(searchResult);
  } catch (err) {
    console.error("Search failed:", err);
    res.status(502).json({
      error: "The search is not working right now. Try again later.",
    });
  }
});

export default router;
