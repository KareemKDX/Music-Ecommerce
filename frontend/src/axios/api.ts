import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // GUEST CART - lets the server find the cart when no one is logged in
  const cartToken = localStorage.getItem("cartToken");

  if (cartToken) {
    config.headers["X-Cart-Token"] = cartToken;
  }

  return config;
});

export default api;
