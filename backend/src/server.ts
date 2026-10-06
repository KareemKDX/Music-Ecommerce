import express from "express";
import productRouter from "./routes/product-routes";
import cartRouter from "./routes/cart-routes";
import orderRouter from "./routes/order-routes";
import customerRouter from "./routes/customer-routes";
import adminRouter from "./routes/admin-routes";
import cors from "cors";
import currencyRouter from "./routes/currency-routes";

const app = express();

app.use(express.json());
app.use(cors());

app.use("/api/products", productRouter);
app.use("/api/cart", cartRouter);
app.use("/api/orders", orderRouter);
app.use("/api/customer", customerRouter);
app.use("/api/admin", adminRouter);
app.use("/api/currency", currencyRouter);

app.get("/", (req, res) => {
  res.send("Backend fungerar!");
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
