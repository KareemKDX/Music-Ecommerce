import { useContext, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api from "../axios/api";
import CartContext from "../context/CartContext";

type ReturnOrder = {
  id: number;
  payment_status: string;
  shipping_address: string;
  items: {
    id: number;
    product_name: string;
    quantity: number;
    price: number;
  }[];
};

function OrderReturnPage() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");

  const context = useContext(CartContext);
  const [order, setOrder] = useState<ReturnOrder | null>(null);
  const [error, setError] = useState("");

  if (!context) {
    throw new Error("Context error in ReturnPage.tsx");
  }

  const { setCart } = context;

  // FETCH ORDER
  // ASK EVERY 2 SEOCND (MAX 10)
  useEffect(() => {
    if (!sessionId) {
      return;
    }

    let attempts = 0;
    let timer: number | undefined;

    async function loadOrder() {
      try {
        const response = await api.get("/orders/by-session", {
          params: { session_id: sessionId },
        });

        setOrder(response.data);

        if (response.data.payment_status === "unpaid" && attempts < 10) {
          attempts++;
          timer = window.setTimeout(loadOrder, 2000);
        }
      } catch (err) {
        console.error(err);
        setError("Could not fetch your order. Please check your orders later.");
      }
    }

    loadOrder();

    return () => window.clearTimeout(timer);
  }, [sessionId]);

  useEffect(() => {
    if (order?.payment_status === "paid") {
      setCart([]);
    }
  }, [order?.payment_status]);

  if (!sessionId) {
    return <p>No order to show.</p>;
  }

  if (error) {
    return <p className="error-text">{error}</p>;
  }

  if (!order) {
    return <p>Loading your order...</p>;
  }

  let total = 0;
  for (const item of order.items) {
    total = total + item.price * item.quantity;
  }

  return (
    <div className="return-page">
      {order.payment_status === "paid" && (
        <>
          <h1>Thank you for your order!</h1>
          <p>Your payment went through.</p>
        </>
      )}

      {order.payment_status === "unpaid" && (
        <>
          <h1>Confirming your payment...</h1>
          <p>This usually takes a few seconds.</p>
        </>
      )}

      {order.payment_status === "cancelled" && (
        <>
          <h1>The order was cancelled</h1>
          <p>No payment was made.</p>
        </>
      )}

      <div className="return-order">
        <h2>Order #{order.id}</h2>
        <p>Payment status: {order.payment_status}</p>
        <p>Shipping address: {order.shipping_address}</p>

        {order.items.map((item) => (
          <p key={item.id}>
            {item.product_name} - {item.quantity} st - {item.price} kr
          </p>
        ))}

        <strong>Total: {total} kr</strong>
      </div>

      <Link className="primary-button" to="/">
        Continue shopping
      </Link>
    </div>
  );
}

export default OrderReturnPage;
