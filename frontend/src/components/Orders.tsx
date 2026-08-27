import { useEffect, useState } from "react";
import api from "../axios/api";
import type { Order } from "../types/Order";

function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);

  //FETCH ALL ORDERS
  useEffect(() => {
    async function getOrders() {
      try {
        const response = await api.get("/orders");
        setOrders(response.data);
        console.log("Orders fetched:", response.data);
      } catch (error) {
        console.error("Kunde inte hämta orders:", error);
      }
    }

    getOrders();
  }, []);

  async function handleOrderStatusChange(orderId: number, status: string) {
    try {
      await api.put("/orders/" + orderId, { status });

      console.log("Succesfully updated order status to: " + status);

      // UPDATE FRONTEND UI
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.id === orderId ? { ...order, status } : order,
        ),
      );
    } catch (error) {
      console.error("Error updating order status:", error);
    }
  }

  return (
    <div>
      <div className="orders-container">
        <h2>Customer Orders</h2>

        {orders.map((order) => (
          <div className="order-card" key={order.id}>
            <h3>Order Number: #{order.id}</h3>

            <h4>Customer-ID: {order.user_id}</h4>

            <div className="order-status">
              <p>Order status: </p>
              <select
                className="order-status-dropdown"
                value={order.status}
                onChange={(e) =>
                  handleOrderStatusChange(order.id, e.target.value)
                }
              >
                <option value="Ordered">Ordered</option>
                <option value="Processing">Processing</option>
                <option value="Shipped">Shipped</option>
                <option value="Delivered">Delivered</option>
              </select>
            </div>
            <p>Datum: {order.created_at}</p>
            <p>Shipping Adress: {order.shipping_address}</p>

            <div className="order-items-box">
              <h4>Order Items:</h4>

              {order.items.map((item) => (
                <div key={item.id}>
                  <p>
                    {item.product_name} - {item.quantity} st - {item.price} kr
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Orders;
