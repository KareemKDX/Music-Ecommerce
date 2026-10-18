import { Link } from "react-router-dom";
import type { Order } from "../types/Order";

import "../css/RecentOrders.css";

type RecentOrdersProps = {
  orders: Order[];
  limit?: number;
};

function RecentOrders({ orders, limit = 5 }: RecentOrdersProps) {
  // newest first, then only the first few
  const newestOrders = [...orders].reverse().slice(0, limit);

  if (newestOrders.length === 0) {
    return <p className="recent-orders-empty">No orders yet.</p>;
  }

  return (
    <div className="recent-orders">
      {newestOrders.map((order) => (
        <Link className="recent-order-row" to="/admin/orders" key={order.id}>
          <span className="recent-order-id">Order #{order.id}</span>
          <span className="recent-order-status">{order.status}</span>
        </Link>
      ))}
    </div>
  );
}

export default RecentOrders;
