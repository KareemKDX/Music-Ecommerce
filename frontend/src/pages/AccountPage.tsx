import "../css/AccountPage.css";
import api from "../axios/api";
import type { Order } from "../types/Order";
import { useEffect, useState } from "react";
import { formatDeliveryDate } from "../utils/formatDeliveryDate";

function AccountPage() {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    async function getCustomerOrders() {
      try {
        const response = await api.get("/customer/me/orders");
        setOrders(response.data);
      } catch (error) {
        console.error(error);
      }
    }

    getCustomerOrders();
  }, []);

  return (
    <div className="account-page">
      <div className="account-header">
        <h1>My account</h1>
        <span className="account-badge">Coming soon</span>
        <p>
          We are building a place for your orders, details and downloads. Stay
          tuned!
        </p>
      </div>

      <div className="account-container">
        <section className="account-card account-profile">
          <div className="account-avatar">S</div>
          <h2>Your profile</h2>

          <div className="account-step">
            <span>1</span>Personal details
          </div>
          <input type="text" placeholder="Full name" disabled />
          <input type="email" placeholder="Email" disabled />

          <div className="account-step">
            <span>2</span>Shipping address
          </div>
          <input type="text" placeholder="Street address" disabled />
          <div className="account-row">
            <input type="text" placeholder="Postal code" disabled />
            <input type="text" placeholder="City" disabled />
          </div>

          <button className="account-save-button" disabled>
            Save changes
          </button>
        </section>
        <section className="account-card account-features">
          <h2>Order History</h2>

          {orders.map((order) => (
            <div className="account-feature" key={order.id}>
              <div className="account-feature-icon">📦</div>

              <div>
                <h3>Receipt number #{order.id}</h3>
                <p>Date: {formatDeliveryDate(order.created_at)}</p>
                <p>Status: {order.status}</p>
              </div>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}

export default AccountPage;
