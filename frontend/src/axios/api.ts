import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  // Send the httpOnly login cookie with every request (the API is on another domain)
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  // GUEST CART - lets the server find the cart when no one is logged in
  const cartToken = localStorage.getItem("cartToken");

  if (cartToken) {
    config.headers["X-Cart-Token"] = cartToken;
  }

  return config;
});

export default api;
