import express, {
  type NextFunction,
  type Request,
  type Response,
} from "express";
import productRouter from "./routes/product-routes";
import cartRouter from "./routes/cart-routes";
import orderRouter from "./routes/order-routes";
import customerRouter from "./routes/customer-routes";
import adminRouter from "./routes/admin-routes";
import cors from "cors";
import currencyRouter from "./routes/currency-routes";
import importRouter from "./routes/imports";
import searchRouter from "./routes/search";
import checkoutRouter from "./routes/checkout";
import webhookRouter from "./routes/webhook";

const app = express();

app.use("/api/stripe/webhook", webhookRouter);
app.use(express.json());
app.use(cors());

app.use("/api/products", productRouter);
app.use("/api/cart", cartRouter);
app.use("/api/orders", orderRouter);
app.use("/api/customer", customerRouter);
app.use("/api/admin", adminRouter);
app.use("/api/currency", currencyRouter);
app.use("/api/import", importRouter);
app.use("/api/search", searchRouter);
app.use("/api/checkout", checkoutRouter);

app.get("/", (req, res) => {
  res.send("Backend fungerar!");
});

app.use((err: unknown, req: Request, res: Response, _next: NextFunction) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error(`${req.method} ${req.originalUrl} failed: ${message}`);
  res.status(500).json({ error: "Something went wrong on the server" });
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
