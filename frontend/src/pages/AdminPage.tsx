import { useEffect, useState } from "react";
import type { Product } from "../types/Product";
import type { Order } from "../types/Order";
import { Link } from "react-router-dom";

import api from "../axios/api";
import "../css/AdminPage.css";
import "../css/Products.css";

function AdminPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  // const token = localStorage.getItem("token");

  useEffect(() => {
    async function getDashboardData() {
      try {
        const productResponse = await api.get("/products");
        const orderResponse = await api.get("/orders");

        const productData: Product[] = productResponse.data;
        const orderData: Order[] = orderResponse.data;

        setProducts(productData);
        setOrders(orderData);
      } catch (error) {
        console.error(error);
      }
    }

    getDashboardData();
  }, []);

  return (
    <div className="admin-page">
      <div className="admin-header-content">
        <div>
          <h1>Admin Dashboard</h1>
          <p className="admin-subtitle">Overview of products and orders</p>
        </div>
      </div>

      <div className="admin-content">
        <div className="admin-panel">
          <div className="admin-product-header-box">
            <h2>Product</h2>
            <p>Total products: {products.length}</p>
          </div>
          <div className="admin-actions">
            <Link className="outline-button" to="/admin/products">
              Product Dashboard
            </Link>

            <Link className="primary-button" to="/admin/orders">
              See orders
            </Link>
          </div>
        </div>
        <div className="admin-panel">
          <div className="admin-product-header-box">
            <h2>Orders</h2>
            <p>Total orders: {orders.length}</p>
          </div>

          <div className="admin-actions">
            <Link className="outline-button" to="/admin/orders">
              Order Dashboard
            </Link>

            <Link className="primary-button" to="/admin/orders">
              See orders
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminPage;
