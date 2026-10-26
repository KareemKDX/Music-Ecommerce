import { useContext } from "react";
import CartContext from "../context/CartContext";
import "../css/Cart.css";
import { useNavigate } from "react-router-dom";

import { isTokenValid } from "../utils/isTokenValid";

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

  return (
    <div className="cart-content">
      <h2>Shopping Cart</h2>

      {!isLoggedIn ? (
        <div className="empty-cart">
          <p>Please log in to view your shopping cart.</p>
          <button onClick={() => navigate("/login")}>Login</button>
        </div>
      ) : cart.length === 0 ? (
        <p className="empty-cart">Shopping cart is empty</p>
      ) : (
        <>
          <div className="cart-items">
            {cart.map((item) => (
              <div className="cart-item" key={item.id}>
                <div>
                  <h3>{item.name}</h3>

                  <p>
                    {item.price} kr × {item.quantity}
                  </p>

                  <button>-</button>
                  <button>+</button>
                </div>

                <button
                  className="remove-cart-item"
                  onClick={() => removeFromCart(item.product_id)}
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          <div className="cart-total">
            Summa: <strong>{cartTotal} kr</strong>
          </div>

          <button
            className="checkout-button"
            onClick={() => navigate("/order")}
          >
            Till checkout
          </button>
        </>
      )}
    </div>
  );
}

export default Cart;
