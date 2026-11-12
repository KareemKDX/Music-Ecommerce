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
import cookieParser from "cookie-parser";
import authRouter from "./routes/auth-routes";
import googleAuthRouter from "./routes/google-auth-routes";
import currencyRouter from "./routes/currency-routes";
import importRouter from "./routes/imports";
import searchRouter from "./routes/search";
import checkoutRouter from "./routes/checkout";
import webhookRouter from "./routes/webhook";
import shippingRouter from "./routes/shipping-routes";
import { deleteOldGuestCarts } from "./services/cart-service";

const app = express();

app.use("/api/stripe/webhook", webhookRouter);
app.use(express.json());
// Shop and API are on different domains: allow the shop, and let the browser send the login cookie
const clientUrl = (process.env.CLIENT_URL ?? "").replace(/\/$/, "");
app.use(cors({ origin: clientUrl, credentials: true }));
app.use(cookieParser()); // reads the httpOnly login cookie (req.cookies.token)

app.use("/api/products", productRouter);
app.use("/api/cart", cartRouter);
app.use("/api/orders", orderRouter);
app.use("/api/customer", customerRouter);
app.use("/api/auth/google", googleAuthRouter);
app.use("/api/auth", authRouter);
app.use("/api/admin", adminRouter);
app.use("/api/currency", currencyRouter);
app.use("/api/import", importRouter);
app.use("/api/search", searchRouter);
app.use("/api/checkout", checkoutRouter);
app.use("/api/shipping", shippingRouter);

app.get("/", (req, res) => {
  res.send("Backend fungerar!");
});

app.use((err: unknown, req: Request, res: Response, _next: NextFunction) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error(`${req.method} ${req.originalUrl} failed: ${message}`);
  res.status(500).json({ error: "Something went wrong on the server" });
});

// CLEAN UP OLD GUEST CARTS WHEN THE SERVER STARTS AND THEN ONCE A DAY
deleteOldGuestCarts();
setInterval(deleteOldGuestCarts, 24 * 60 * 60 * 1000);

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
