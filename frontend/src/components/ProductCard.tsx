import { useContext } from "react";
import type { Product } from "../types/Product";
import CartContext from "../context/CartContext";
import CurrencyContext from "../context/CurrencyContext";
import { isTokenValid } from "../utils/isTokenValid";
import { useNavigate } from "react-router-dom";

function ProductCard({ product }: { product: Product }) {
  const context = useContext(CartContext);
  const token = localStorage.getItem("token");
  const isLoggedIn = isTokenValid(token);
  const navigate = useNavigate();

  const currencyContext = useContext(CurrencyContext);

  if (!currencyContext) {
    throw new Error("Hittar ej CurrencyContext i productcard.tsx");
  }

  const { chosenCurrency, rates } = currencyContext;
  console.log("currency:", chosenCurrency);
  console.log("rates:", rates);

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

  function convertPrice(price: number, currency: string) {
    if (!rates) {
      return price + " kr";
    }

    if (currency === "EUR") {
      return (price * rates.rates.EUR).toFixed(2) + " €";
    }
    if (currency === "USD") {
      return (price * rates.rates.USD).toFixed(2) + " $";
    }
    return price + " kr";
  }

  const { addToCart } = context;

  return (
    <div className="product-card">
      <div className="product-image">
        <img src={"/Images/" + product.image} alt={product.name} />
      </div>

      <div className="product-info">
        <h2>{product.name}</h2>
        <p className="product-price">
          {convertPrice(product.price, chosenCurrency)}
        </p>
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
