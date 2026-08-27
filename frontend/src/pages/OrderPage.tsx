import { useContext, useState } from "react";
import CartContext from "../context/CartContext";
import "../css/OrderPage.css";
import { useNavigate } from "react-router-dom";
import api from "../axios/api";

function OrderPage() {
  const context = useContext(CartContext);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");

  if (!context) {
    throw new Error("Context error in OrderPage.tsx");
  }

  const { cart, setCart } = context;
  const navigate = useNavigate();

  const cartTotal = cart.reduce(
    (total, item) => total + item.price * item.quantity,
    0,
  );

  async function handleSubmit(event: React.SubmitEvent) {
    event.preventDefault();

    try {
      const response = await api.post("/orders", {
        shippingAddress,
        items: cart.map((item) => ({
          productId: item.product_id,
          quantity: item.quantity,
          price: item.price,
        })),
      });

      console.log("Order created:", response.data);

      // CLEAN CART FROM UI
      setCart([]);
      navigate("/");
    } catch (error) {
      console.error("Couldn't create order:", error);
    }
  }

  return (
    <div className = "order-page">
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
                <span>Totalt</span>
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

            <button type="submit">Lägg beställning</button>
          </form>
        </section>
      </div>
    </div>
  );
}

export default OrderPage;
