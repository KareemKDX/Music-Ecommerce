import { useContext, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api from "../axios/api";
import CartContext from "../context/CartContext";
import "../css/OrderReturnPage.css";
import { formatDeliveryDate } from "../utils/formatDeliveryDate";

type ReturnOrder = {
  id: number;
  payment_status: string;
  shipping_address: string;
  shipping_method: "service_point" | "home" | null;
  shipping_price: string | number;
  service_point_name: string | null;
  service_point_address: string | null;
  estimated_delivery: string | null;
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
  const shippingPrice = Number(order.shipping_price ?? 0);
  total = total + shippingPrice;

  return (
    <div className="return-page">
      <div className="return-header">
        {order.payment_status === "paid" && (
          <>
            <div className="return-icon return-icon-paid">✓</div>
            <h1>Thank you for your order!</h1>
            <p>Your payment went through.</p>
          </>
        )}

        {order.payment_status === "unpaid" && (
          <>
            <div className="return-icon return-icon-pending">…</div>
            <h1>Confirming your payment...</h1>
            <p>This usually takes a few seconds.</p>
          </>
        )}

        {order.payment_status === "cancelled" && (
          <>
            <div className="return-icon return-icon-cancelled">×</div>
            <h1>The order was cancelled</h1>
            <p>No payment was made.</p>
          </>
        )}
      </div>

      <div className="return-order">
        <div className="return-order-top">
          <h2>Order #{order.id}</h2>
          <span
            className={"return-status return-status-" + order.payment_status}
          >
            {order.payment_status}
          </span>
        </div>

        <p className="return-address">
          Shipping address: {order.shipping_address}
        </p>

        <div className="return-items">
          {order.items.map((item) => (
            <div className="return-item" key={item.id}>
              <span>
                {item.product_name} × {item.quantity}
              </span>
              <span>{item.price * item.quantity} kr</span>
            </div>
          ))}
          {order.shipping_method && (
            <div className="return-item">
              <span>
                {order.shipping_method === "service_point"
                  ? "Frakt – PostNord ombud"
                  : "Frakt – Hemleverans"}
              </span>
              <span>{shippingPrice === 0 ? "Fri frakt" : shippingPrice + " kr"}</span>
            </div>
          )}
        </div>

        {order.service_point_name && (
          <p className="return-address">
            Ombud: {order.service_point_name}, {order.service_point_address}
          </p>
        )}
        {order.estimated_delivery && (
          <p className="return-address">
            Beräknad leverans: {formatDeliveryDate(order.estimated_delivery)}
          </p>
        )}

        <div className="return-total">
          <span>Total</span>
          <strong>{total} kr</strong>
        </div>
      </div>

      <Link className="primary-button" to="/">
        Continue shopping
      </Link>
    </div>
  );
}
export default OrderReturnPage;
