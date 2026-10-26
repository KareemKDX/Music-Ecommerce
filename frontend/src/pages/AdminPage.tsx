import { useEffect, useState } from "react";
import type { Product } from "../types/Product";
import type { Order } from "../types/Order";

import { Link } from "react-router-dom";
import RecentOrders from "../components/RecentOrders";

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
        <div className="admin-main-menu-top-section">
          <h1>Admin Dashboard</h1>
          <p className="admin-subtitle">Overview of products and orders</p>
        </div>
      </div>

      <div className="admin-content">
        <div className="admin-upper-menu">
          <div className="admin-panel">
            <div className="admin-product-header-box">
              <h2>Product</h2>
              <p>Total products: {products.length}</p>
            </div>
            <div className="admin-actions">
              <Link className="outline-button" to="/admin/products">
                Product Dashboard
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
            </div>
          </div>
        </div>

        <div className="admin-lower-menu">
          <div className="admin-panel full">
            <div className="admin-product-header-box">
              <h2>Recent orders</h2>
            </div>

            <RecentOrders orders={orders} />
          </div>

          <div className="admin-panel full">
            <div className="admin-product-header-box">
              <h2>Quick actions</h2>
            </div>

            <div className="admin-quick-actions">
              <Link
                className="quick-tile quick-tile-primary"
                to="/admin/product/create"
              >
                <span className="quick-tile-title">Create product</span>
                <span className="quick-tile-text">
                  Add a new product to the shop
                </span>
              </Link>

              <Link className="quick-tile" to="/admin/products">
                <span className="quick-tile-title">Manage products</span>
                <span className="quick-tile-text">
                  Edit, delete or import from supplier
                </span>
              </Link>

              <Link className="quick-tile" to="/admin/orders">
                <span className="quick-tile-title">View orders</span>
                <span className="quick-tile-text">
                  Check and update order status
                </span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminPage;
