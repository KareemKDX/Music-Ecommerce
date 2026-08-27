import axios from "axios";

//"https://eshop-backend-gules.vercel.app/api"

const api = axios.create({
  baseURL: "https://eshop-backend-gules.vercel.app/api",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default api;
