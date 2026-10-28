import { useContext } from "react";
import CartContext from "../context/CartContext";
import "../css/Cart.css";
import { useNavigate } from "react-router-dom";
import { Minus, Plus, ShoppingBag, X } from "lucide-react";

import { isTokenValid } from "../utils/isTokenValid";

const formatPrice = (amount: number) => `${amount.toLocaleString("sv-SE")} kr`;

function Cart() {
  const context = useContext(CartContext);
  const navigate = useNavigate();

  //Check User
  const token = localStorage.getItem("token");
  const isLoggedIn = isTokenValid(token);

  if (!context) {
    throw new Error("Context error in Cart.tsx");
  }

  const { cart, removeFromCart } = context;

  const cartTotal = cart.reduce(
    (total, item) => total + item.price * item.quantity,
    0,
  );

  const itemCount = cart.reduce((count, item) => count + item.quantity, 0);

  return (
    <div className="cart-content">
      <div className="cart-header">
        <h2>Shopping Cart</h2>
        {isLoggedIn && itemCount > 0 && (
          <span className="cart-header-count">
            {itemCount} {itemCount === 1 ? "item" : "items"}
          </span>
        )}
      </div>

      {!isLoggedIn ? (
        <div className="cart-empty-state">
          <ShoppingBag size={32} strokeWidth={1.5} />
          <p>Please log in to view your shopping cart.</p>
          <button
            className="checkout-button"
            onClick={() => navigate("/login")}
          >
            Login
          </button>
        </div>
      ) : cart.length === 0 ? (
        <div className="cart-empty-state">
          <ShoppingBag size={32} strokeWidth={1.5} />
          <p>Shopping cart is empty</p>
        </div>
      ) : (
        <>
          <ul className="cart-items">
            {cart.map((item) => (
              <li className="cart-item" key={item.id}>
                <div className="cart-item-info">
                  <h3>{item.name}</h3>
                  <span className="cart-item-unit-price">
                    {formatPrice(item.price)}
                  </span>

                  <div className="cart-quantity">
                    <button aria-label="Decrease quantity">
                      <Minus size={14} />
                    </button>
                    <span>{item.quantity}</span>
                    <button aria-label="Increase quantity">
                      <Plus size={14} />
                    </button>
                  </div>
                </div>

                <div className="cart-item-side">
                  <button
                    className="remove-cart-item"
                    aria-label={`Remove ${item.name}`}
                    onClick={() => removeFromCart(item.product_id)}
                  >
                    <X size={16} />
                  </button>
                  <span className="cart-item-total">
                    {formatPrice(item.price * item.quantity)}
                  </span>
                </div>
              </li>
            ))}
          </ul>

          <div className="cart-footer">
            <div className="cart-total">
              <span>Summa</span>
              <strong>{formatPrice(cartTotal)}</strong>
            </div>
            <p className="cart-shipping-note">Frakt beräknas i kassan</p>

            <button
              className="checkout-button"
              onClick={() => navigate("/order")}
            >
              Till checkout
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default Cart;
