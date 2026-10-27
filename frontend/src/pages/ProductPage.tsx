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
        <Loading />
      </div>
    );
  }

  if (!product) {
    return <p className="product-loading">Product not found.</p>;
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

  // Stock label
  let stockText = "";
  let stockClass = "stock-in";
  let soldOut = false;

  if (product.stock === 0) {
    stockText = "Out of stock";
    stockClass = "stock-out";
    soldOut = true;
  } else if (product.stock !== undefined && product.stock !== null) {
    if (product.stock <= 5) {
      stockText = "Only " + product.stock + " left";
      stockClass = "stock-low";
    } else {
      stockText = "In stock";
    }
  }

  return (
    <div className="product-page">
      <button className="product-back-link" onClick={() => navigate("/")}>
        <span className="product-back-arrow">←</span>
        Back to products
      </button>

      <div className="product-details-card">
        <div className="product-details-image">
          <img
            src={
              product.image_url ? product.image_url : "/Images/" + product.image
            }
            alt={product.name}
          />
        </div>

        <div className="product-details-info">
          <p className="product-category">MUSIC EQUIPMENT</p>
          <h1 className="product-details-info-h1">{product.name}</h1>
          <div className="product-specs">
            <div>
              <p>Article no: {product.sku} </p>
            </div>

            <div>
              <p>Category: Electronics</p>
            </div>
          </div>

          {stockText !== "" && (
            <p className={"product-stock " + stockClass}>{stockText}</p>
          )}

          <p className="product-description">{product.description}</p>

          <div className="product-buy-row">
            <p className="product-details-price">{product.price} kr</p>

            <button
              className="add-product-button"
              onClick={handleAddToCart}
              disabled={soldOut}
            >
              {soldOut
                ? "Out of stock"
                : !isLoggedIn
                  ? "Log in to purchase"
                  : "Add to cart"}
            </button>
          </div>
          <ul className="product-perks">
            <li>Secure payment with Stripe</li>
            <li>Fast delivery</li>
            <li>30 days return</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default ProductPage;
