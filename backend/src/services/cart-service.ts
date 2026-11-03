import { randomUUID } from "crypto";
import { pool } from "../mysql-database";

// A cart belongs to a logged in user (user_id) or to a guest (guest_token).
// The guest token is made by the server and saved in the browser's localStorage.

// FIND CART ID. RETURNS NULL IF THERE IS NO CART YET
export async function findCartId(
  userId: number | undefined,
  guestToken: string | undefined,
) {
  if (userId) {
    const [rows] = await pool.execute(
      "SELECT id FROM carts WHERE user_id = ?",
      [userId],
    );
    const carts = rows as { id: number }[];
    return carts.length > 0 ? carts[0].id : null;
  }

  if (guestToken) {
    const [rows] = await pool.execute(
      "SELECT id FROM carts WHERE guest_token = ? AND user_id IS NULL",
      [guestToken],
    );
    const carts = rows as { id: number }[];
    return carts.length > 0 ? carts[0].id : null;
  }

  return null;
}

// CREATE A CART IF THERE IS NONE. guestToken IS ONLY SET FOR NEW GUEST CARTS
export async function getOrCreateCart(
  userId: number | undefined,
  guestToken: string | undefined,
) {
  const cartId = await findCartId(userId, guestToken);

  if (cartId) {
    return { cartId, guestToken: null };
  }

  if (userId) {
    // IGNORE -> if two requests come at the same time only one cart is made
    await pool.execute("INSERT IGNORE INTO carts (user_id) VALUES (?)", [
      userId,
    ]);
    const newCartId = await findCartId(userId, undefined);
    return { cartId: newCartId!, guestToken: null };
  }

  const newToken = randomUUID();
  const [result] = await pool.execute(
    "INSERT INTO carts (guest_token) VALUES (?)",
    [newToken],
  );
  const newCartId = (result as { insertId: number }).insertId;
  return { cartId: newCartId, guestToken: newToken };
}

// MOVE A GUEST CART TO A USER WHEN THEY LOG IN OR CREATE AN ACCOUNT
export async function mergeGuestCart(
  userId: number,
  guestToken: string | undefined,
) {
  if (!guestToken) {
    return;
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [guestRows] = await connection.execute(
      "SELECT id FROM carts WHERE guest_token = ? AND user_id IS NULL",
      [guestToken],
    );
    const guestCart = (guestRows as { id: number }[])[0];

    if (!guestCart) {
      await connection.rollback();
      return;
    }

    const [userRows] = await connection.execute(
      "SELECT id FROM carts WHERE user_id = ?",
      [userId],
    );
    const userCart = (userRows as { id: number }[])[0];

    if (!userCart) {
      // USER HAS NO CART -> THE GUEST CART BECOMES THE USER'S CART
      await connection.execute(
        "UPDATE carts SET user_id = ?, guest_token = NULL WHERE id = ?",
        [userId, guestCart.id],
      );
    } else {
      // USER HAS A CART -> MOVE THE ITEMS OVER, ADD QUANTITIES FOR SAME PRODUCT
      const [itemRows] = await connection.execute(
        "SELECT product_id, quantity FROM cart_items WHERE cart_id = ?",
        [guestCart.id],
      );
      const items = itemRows as { product_id: number; quantity: number }[];

      for (const item of items) {
        await connection.execute(
          `INSERT INTO cart_items (cart_id, product_id, quantity)
           VALUES (?, ?, ?)
           ON DUPLICATE KEY UPDATE quantity = quantity + ?`,
          [userCart.id, item.product_id, item.quantity, item.quantity],
        );
      }

      // Guest cart items are removed by ON DELETE CASCADE
      await connection.execute("DELETE FROM carts WHERE id = ?", [
        guestCart.id,
      ]);
    }

    await connection.commit();
  } catch (error) {
    // Login should still work even if the merge fails
    await connection.rollback();
    console.error("Could not merge guest cart:", error);
  } finally {
    connection.release();
  }
}

// DELETE GUEST CARTS THAT NOBODY HAS USED FOR 30 DAYS
export async function deleteOldGuestCarts() {
  try {
    await pool.execute(
      "DELETE FROM carts WHERE user_id IS NULL AND updated_at < NOW() - INTERVAL 30 DAY",
    );
  } catch (error) {
    console.error("Could not delete old guest carts:", error);
  }
}
