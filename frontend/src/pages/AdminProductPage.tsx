import { useEffect, useState } from "react";
import type { Product } from "../types/Product";
import type { ImportedProduct, SkippedProduct } from "../types/importedProduct";
import { Link } from "react-router-dom";
import AdminProductCard from "../components/AdminProductCard";
import "../css/AdminProductPage.css";
import "../css/ImportedProduct.css";
import ImportProduct from "../components/ImportProduct";

import api from "../axios/api";
import "../css/AdminPage.css";
import "../css/Products.css";

function AdminPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [importedProducts, setImportedProducts] = useState<ImportedProduct[]>(
    [],
  );
  const [skippedProducts, setSkippedProducts] = useState<SkippedProduct[]>([]);
  const [isImported, setIsImported] = useState(false);
  const [formatType, setFormatType] = useState("");
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

  async function importProducts(format: string) {
    try {
      const response = await api.get("/import/" + format);

      const importedData: ImportedProduct[] = response.data.products;
      const skippedData: SkippedProduct[] = response.data.skipped ?? [];
      console.log(skippedData);
      setImportedProducts(importedData);
      setSkippedProducts(skippedData);
      setFormatType(format);
      setIsImported(true);
    } catch (error) {
      console.error(error);
    }
  }

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

  function handleCloseImport() {
    setIsImported(false);
  }

  return (
    <div className="admin-page">
      <div className="admin-header-content">
        <div>
          <h1>Admin Dashboard</h1>

          <p className="admin-subtitle">Manage products and supplier imports</p>
          <Link to="/admin" className="back-link">
            <span className="back-link-arrow">←</span>
            Back to dashboard
          </Link>
        </div>
      </div>

      <div className="admin-product-container">
        <div className="admin-product-header-box">
          <h2>Products ({products.length})</h2>

          <div className="admin-actions">
            <button
              className={
                isImported ? "outline-button inactive" : "outline-button"
              }
              onClick={() => importProducts("csv")}
            >
              Import from Supplier CSV
            </button>
            <button
              className={
                isImported ? "outline-button inactive" : "outline-button"
              }
              onClick={() => importProducts("xml")}
            >
              Import from Supplier XML
            </button>
            <Link className="primary-button" to="/admin/product/create">
              + Create New Product
            </Link>
          </div>
        </div>

        {isImported && <button onClick={handleCloseImport}>Close</button>}

        {isImported && (
          <ImportProduct
            importedProducts={importedProducts}
            skippedProducts={skippedProducts}
            formatType={formatType}
          />
        )}

        <div className="product-container">
          {products.map((product) => (
            <AdminProductCard
              key={product.id}
              product={product}
              deleteProduct={deleteProduct}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default AdminPage;
