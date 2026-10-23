import { useContext, useState } from "react";
import CartContext from "../context/CartContext";
import "../css/OrderPage.css";

import api from "../axios/api";

function OrderPage() {
  const context = useContext(CartContext);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");

  const [checkoutError, setCheckoutError] = useState("");
  const [paying, setPaying] = useState(false);

  if (!context) {
    throw new Error("Context error in OrderPage.tsx");
  }

  const { cart } = context;

  const cartTotal = cart.reduce(
    (total, item) => total + item.price * item.quantity,
    0,
  );

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setCheckoutError("");
    setPaying(true);

    try {
      const response = await api.post("/checkout/hosted", { shippingAddress });

      // SEND CUSTOMER TO STRIPE
      window.location.href = response.data.url;
    } catch (error: any) {
      const message = error.response?.data?.error;
      setCheckoutError(
        message ?? "Could not start the payment. Try again later.",
      );
      setPaying(false);
    }
  }

  return (
    <div className="order-page">
      <h1>Checkout</h1>

      <div className="order-container">
        <section className="order-summary">
          <h2>Your order</h2>

          {cart.length === 0 ? (
            <p>Cart is empty</p>
          ) : (
            <>
              {cart.map((item) => (
                <div className="order-item" key={item.id}>
                  <div>
                    <h3>{item.name}</h3>

                    <p>
                      {item.price} kr × {item.quantity}
                    </p>
                  </div>

                  <strong>{item.price * item.quantity} kr</strong>
                </div>
              ))}

              <div className="order-total">
                <span>Total:</span>
                <strong>{cartTotal} kr</strong>
              </div>
            </>
          )}
        </section>

        <section className="shipping-section">
          <h2>Order Information</h2>

          <form onSubmit={handleSubmit}>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Namn"
              required
            />

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="E-post"
              required
            />

            <input
              value={shippingAddress}
              onChange={(e) => setShippingAddress(e.target.value)}
              placeholder="Leveransadress"
              required
            />

            {checkoutError && <p className="error-text">{checkoutError}</p>}

            <button type="submit" disabled={paying || cart.length === 0}>
              {paying ? "Redirecting to payment..." : "Pay with card"}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}

export default OrderPage;
