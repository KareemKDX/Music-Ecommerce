-- GUEST CARTS
-- Lets people use the cart without being logged in.
-- A guest cart has no user_id, it is found with a random guest_token instead.

ALTER TABLE carts
  MODIFY user_id INT NULL,
  ADD guest_token CHAR(36) NULL,
  ADD updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  ADD UNIQUE KEY unique_user_cart (user_id),
  ADD UNIQUE KEY unique_guest_token (guest_token);

-- One row per product in a cart, so we can add to the quantity instead
ALTER TABLE cart_items
  ADD UNIQUE KEY unique_cart_product (cart_id, product_id);
