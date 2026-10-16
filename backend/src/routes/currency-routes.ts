import { Router } from "express";
import { getRates } from "../integrations/currency-adapter";

const currencyRouter = Router();
currencyRouter.get("/rates", async (req, res, next) => {
  try {
    const base = (req.query.base ?? "SEK") as string;
    res.json(await getRates(base));
  } catch (err) {
    next(err);
  }
});

export default currencyRouter;
