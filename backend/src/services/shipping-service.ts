// The shop's OWN shipping price list. Not an integration: PostNord has no price API for Sweden.
// The price is always calculated here, on the server – React never sends a price.

import { pool } from "../mysql-database";
import type { ShippingMethod } from "../integrations/postnord-adapter";

export const SHIPPING_PRICES: Record<ShippingMethod, number> = {
  service_point: 59,
  home: 99,
};

export const FREE_SHIPPING_FROM = 500;

export const SHIPPING_LABELS: Record<ShippingMethod, string> = {
  service_point: "Frakt – PostNord ombud",
  home: "Frakt – Hemleverans",
};

export const SHOP_POSTAL_CODE = process.env.SHOP_POSTAL_CODE ?? "11122";

export function calculateShipping(method: ShippingMethod, subtotal: number): number {
  if (subtotal >= FREE_SHIPPING_FROM) {
    return 0;
  }
  return SHIPPING_PRICES[method];
}

// The cart's value, with the prices from OUR database
export async function getCartSubtotal(userId: number): Promise<number> {
  const [rows] = await pool.execute(
    `SELECT cart_items.quantity, products.price
     FROM carts
     JOIN cart_items ON cart_items.cart_id = carts.id
     JOIN products ON cart_items.product_id = products.id
     WHERE carts.user_id = ?`,
    [userId],
  );

  let subtotal = 0;
  for (const row of rows as { quantity: number; price: string | number }[]) {
    subtotal += Number(row.price) * row.quantity;
  }
  return subtotal;
}
