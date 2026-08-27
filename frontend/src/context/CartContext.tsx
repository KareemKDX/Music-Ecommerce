import { createContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { CartItem } from "../types/CartItem";
import type { Product } from "../types/Product";
import api from "../axios/api";

type CartContextType = {
  cart: CartItem[];
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
  addToCart: (product: Product) => Promise<void>;
  removeFromCart: (productId: number) => Promise<void>;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);

  useEffect(() => {
    async function getCart() {
      try {
        const response = await api.get("/cart");

        const data = response.data;

        console.log("Cart hämtas från CartContext", data);

        setCart(data);
      } catch (error) {
        console.error(error);
      }
    }

    getCart();
  }, []);

  async function addToCart(product: Product) {
    try {
      await api.post("/cart", {
        productId: product.id,
      });

      const cartResponse = await api.get("/cart");

      const data: CartItem[] = cartResponse.data;

      setCart(data);
    } catch (error) {
      console.error(error);
    }
  }

  async function removeFromCart(productId: number) {
    try {
      await api.delete("/cart/" + productId);

      const cartResponse = await api.get("/cart");

      const data: CartItem[] = await cartResponse.data;

      setCart(data);
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <CartContext.Provider
      value={{
        cart,
        setCart,
        addToCart,
        removeFromCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export default CartContext;
