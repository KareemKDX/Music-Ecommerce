import { useContext } from "react";
import type { Product } from "../types/Product";
import CartContext from "../context/CartContext";
import { isTokenValid } from "../utils/isTokenValid";
import { useNavigate } from "react-router-dom";

function ProductCard({ product }: { product: Product }) {
  const context = useContext(CartContext);
  const token = localStorage.getItem("token");
  const isLoggedIn = isTokenValid(token);
  const navigate = useNavigate();

  if (!context) {
    throw new Error("Hittar ej context i productcard.tsx");
  }

  function handleAddToCart() {
    if (!isLoggedIn) {
      navigate("/login");
      return;
    }

    addToCart(product);
  }

  const { addToCart } = context;

  return (
    <div className="product-card">
      <div className="product-image">
        <img src={"/Images/" + product.image} alt={product.name} />
      </div>

      <div className="product-info">
        <h2>{product.name}</h2>
        <p className="product-price">{product.price} kr</p>
      </div>

      <div className="product-actions">
        <button className="primary-button" onClick={handleAddToCart}>
          Add to cart
        </button>
        <button
          className="secondary-button"
          onClick={() => navigate("/products/" + product.id)}
        >
          More
        </button>
      </div>
    </div>
  );
}

export default ProductCard;
