import { pool } from "../mysql-database";
import { indexProducts } from "../integrations/search-adapter";
import type { Product } from "../types/Product";

export async function reindexAllProducts() {
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

  const indexed = await indexProducts(products);
  return indexed;
}
