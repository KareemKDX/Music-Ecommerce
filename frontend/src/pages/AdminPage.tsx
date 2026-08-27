import { useEffect, useState } from "react";
import type { Product } from "../types/Product";
import { Link } from "react-router-dom";
import AdminProductCard from "../components/AdminProductCard";
import Orders from "../components/Orders";

import api from "../axios/api";
import "../css/AdminPage.css";
import "../css/Products.css";

function AdminPage() {
  const [products, setProducts] = useState<Product[]>([]);
  // const token = localStorage.getItem("token");

  useEffect(() => {
    async function getProducts() {
      try {
        const response = await api.get("/products");

        const data: Product[] = response.data;

        setProducts(data);
      } catch (error) {
        console.error(error);
      }
    }

    getProducts();
  }, []);

  //REMOVE FROM DATABASE
  async function deleteProduct(id: number) {
    try {
      await api.delete("/products/" + id);

      // REMOVE FROM UI
      setProducts((prev) => prev.filter((product) => product.id !== id));
    } catch (error) {
      console.error("Error deleting product", error);
    }
  }

  return (
    <div className="admin-page">
      <div className="admin-header-content">
        <h1>Admin Dashboard</h1>
      </div>

      <div className="admin-content">
        <div className="admin-product-container">
          <div className="admin-product-header-box">
            <h2>Products</h2>
            <p>Manage our products</p>

            <Link className="primary-button" to="/admin/product/create">
              + Create New Product
            </Link>
          </div>

          <div className="admin-product-box">
            {products.map((product) => (
              <AdminProductCard
                key={product.id}
                product={product}
                deleteProduct={deleteProduct}
              />
            ))}
          </div>
        </div>

        <div className="admin-order-container-box">
          <Orders />
        </div>
      </div>
    </div>
  );
}

export default AdminPage;
