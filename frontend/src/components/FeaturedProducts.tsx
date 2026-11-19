import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Product } from "../types/Product";
import CartContext from "../context/CartContext";
import CurrencyContext from "../context/CurrencyContext";
import api from "../axios/api";
import "../css/FeaturedProducts.css";

//Set id on the products we want to show as featured
const FEATURED_PRODUCT_IDS = [100, 105, 107, 108];

function FeaturedProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const navigate = useNavigate();

  const cartContext = useContext(CartContext);
  const currencyContext = useContext(CurrencyContext);

  if (!cartContext) {
    throw new Error("Can't find CartContext in FeaturedProducts.tsx");
  }
  if (!currencyContext) {
    throw new Error("Can't find CurrencyContext in FeaturedProducts.tsx");
  }

  const { addToCart } = cartContext;
  const { chosenCurrency, rates } = currencyContext;

  useEffect(() => {
    //GET FEATURED PRODUCTS
    async function getFeaturedProducts() {
      try {
        const response = await api.get("/products");
        const allProducts: Product[] = response.data;

        //Find products by id's set above
        const featured = FEATURED_PRODUCT_IDS.map((id) =>
          allProducts.find((product) => product.id === id),
        ).filter((product): product is Product => product !== undefined);

        setProducts(featured);
      } catch (error) {
        console.error(error);
      }
    }

    getFeaturedProducts();
  }, []);

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

  return (
    <section className="featured-section">
      <div className="featured-header">
        <p className="featured-label">Handpicked for you</p>
        <h2>Customer Favorites</h2>
        <p className="featured-text">
          The products our customers keep coming back for.
        </p>
      </div>

      <div className="featured-grid">
        {products.map((product, index) => (
          <div
            key={product.id}
            className="featured-card"
            onClick={() => navigate("/products/" + product.id)}
          >
            <span className="featured-badge">#{index + 1}</span>

            <div className="featured-image">
              <img
                src={
                  product.image_url
                    ? product.image_url
                    : "/Images/" + product.image
                }
                alt={product.name}
              />
            </div>

            <div className="featured-info">
              <h3>{product.name}</h3>
              <p className="featured-price">
                {convertPrice(product.price, chosenCurrency)}
              </p>
            </div>

            <button
              className="featured-cart-button"
              onClick={(e) => {
                // Stop the click from also opening the product page
                e.stopPropagation();
                addToCart(product);
              }}
            >
              Add to cart
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

export default FeaturedProducts;
