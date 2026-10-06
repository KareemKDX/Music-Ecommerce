import { Router } from "express";
import { getRates } from "./currency-adapter";

const currencyRouter = Router();

currencyRouter.get("/rates", async (req, res) => {
  const base = (req.query.base ?? "SEK") as string;
  // const symbols = req.query.symbols as string

  res.json(await getRates(base));
});

export default currencyRouter;
