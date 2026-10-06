import { useState, useEffect } from "react";
import type { Product } from "../types/Product";
import ProductCard from "./ProductCard";
import "../css/Products.css";
import api from "../axios/api";
import Loading from "../components/Loading";
import CurrencySelector from "./CurrencySelector";

function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [chosenCurrency, setChosenCurrency] = useState("KR");

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
    <>
      <CurrencySelector
        chosenCurrency={chosenCurrency}
        setChosenCurrency={setChosenCurrency}
      />

      <div className="product-container">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            chosenCurrency={chosenCurrency}
          />
        ))}
      </div>
    </>
  );
}

export default Products;
