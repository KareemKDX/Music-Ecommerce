import { pool } from "../mysql-database";
import type { Product, SkippedProduct } from "../integrations/supplier-adapter";

// SERVICE RETURNS CREATED, UPDATED AND SKIPPED PRODUCTS IN OBJECT.

export type ImportReport = {
  created: number;
  updated: number;
  skipped: SkippedProduct[];
};

export async function saveProducts(
  products: Product[],
  skipped: SkippedProduct[],
): Promise<ImportReport> {
  let created = 0;
  let updated = 0;

  for (const product of products) {
    // CHECK IF PRODUCT ALREADY EXISTS
    const [rows] = await pool.query("SELECT id FROM products WHERE sku = ?", [
      product.sku,
    ]);

    if ((rows as any[]).length > 0) {
      // IF YES, VALIDATE FIELDS AGAIN AND UDATE
      await pool.query(
        "UPDATE products SET name = ?, price = ? WHERE sku = ?",
        [product.name, product.price, product.sku],
      );
      updated++;
    } else {
      // IF NO, CREATE NEW PRODUCT
      await pool.query(
        "INSERT INTO products (sku, name, description, price, image) VALUES (?, ?, ?, ?, ?)",
        [
          product.sku,
          product.name,
          product.description,
          product.price,
          product.image,
        ],
      );
      created++;
    }
  }

  return { created, updated, skipped };
}
