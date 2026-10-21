import { useEffect, useState } from "react";
import type { Product } from "../types/Product";
import type { ImportedProduct, SkippedProduct } from "../types/importedProduct";
import { Link } from "react-router-dom";
import AdminProductCard from "../components/AdminProductCard";
import "../css/AdminProductPage.css";
import "../css/ImportedProduct.css";
import ImportProduct from "../components/ImportProduct";
import Loading from "../components/Loading";

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
  const [updatedCount, setUpdatedCount] = useState(0);
  const [createdCount, setCreatedCount] = useState(0);
  const [deleteMessage, setDeleteMessage] = useState("");

  const [loading, setLoading] = useState(false);

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
    setLoading(true);
    try {
      const response = await api.get("/import/" + format);

      const importedData: ImportedProduct[] = response.data.products;
      const skippedData: SkippedProduct[] = response.data.skipped ?? [];
      console.log(skippedData);
      setImportedProducts(importedData);
      setSkippedProducts(skippedData);
      setFormatType(format);
      setCreatedCount(response.data.created);
      setUpdatedCount(response.data.updated);
      setIsImported(true);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  //REMOVE FROM DATABASE
  async function deleteProduct(id: number) {
    try {
      const response = await api.delete("/products/" + id);
      console.log(response);

      // REMOVE FROM UI
      setProducts((prev) => prev.filter((product) => product.id !== id));
      if (response.data.searchIndexed === false) {
        setDeleteMessage(
          "Produkten är borttagen, men sökindexet är inte uppdaterat.",
        );
      } else {
        setDeleteMessage("Product deleted from both Agolia and Database.");
      }
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

        {loading && (
          <div className="import-product-container">
            <Loading />
          </div>
        )}

        {isImported && (
          <ImportProduct
            importedProducts={importedProducts}
            skippedProducts={skippedProducts}
            formatType={formatType}
            updatedCount={updatedCount}
            createdCount={createdCount}
          />
        )}
        {deleteMessage && (
          <div className="delete-popup">
            {deleteMessage}
            <button onClick={() => setDeleteMessage("")}>×</button>
          </div>
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
