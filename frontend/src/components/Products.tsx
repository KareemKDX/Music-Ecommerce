import { useState, useEffect } from "react";
import type { Product } from "../types/Product";
import ProductCard from "./ProductCard";
import "../css/Products.css";
import api from "../axios/api";
import Loading from "../components/Loading";

function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getProducts() {
      try {
        const response = await api.get("/products");

        const data: Product[] = response.data;
        setProducts(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    getProducts();
  }, []);

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="product-container">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}

export default Products;
