import { useEffect, useState, useContext } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { isTokenValid } from "../utils/isTokenValid";
import CartContext from "../context/CartContext";
import Loading from "../components/Loading";
import api from "../axios/api";
import type { Product } from "../types/Product";
import "../css/ProductPage.css";

function ProductPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState<Product | null>(null);

  const context = useContext(CartContext);

  const token = localStorage.getItem("token");
  const isLoggedIn = isTokenValid(token);
  const [loading, setLoading] = useState(true);

  if (!context) {
    throw new Error("Couldnt find context in ProductPage.tsx");
  }

  const { addToCart } = context;

  useEffect(() => {
    async function getProduct() {
      try {
        const response = await api.get("/products/" + id);
        setProduct(response.data[0]);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    getProduct();
  }, [id]);

  if (loading) {
    return (
      <div className="loading-page-height">
        <Loading />;
      </div>
    );
  }

  if (!product) {
    return <p className="product-loading">Loading...</p>;
  }

  function handleAddToCart() {
    if (!isLoggedIn) {
      navigate("/login");
      return;
    }

    if (product) {
      addToCart(product);
    }
  }

  return (
    <div className="product-page">
      <button className="back-button" onClick={() => navigate("/")}>
        ← Back to products
      </button>

      <div className="product-details-card">
        <div className="product-details-image">
          <img src={"/Images/" + product.image} alt={product.name} />
        </div>

        <div className="product-details-info">
          <p className="product-category">MUSIC EQUIPMENT</p>

          <h1>{product.name}</h1>

          <p className="product-description">{product.description}</p>

          <p className="product-details-price">{product.price} kr</p>

          <button className="add-product-button" onClick={handleAddToCart}>
            Add to cart
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProductPage;
