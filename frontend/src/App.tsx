import "./App.css";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import OrderPage from "./pages/OrderPage";
import AboutPage from "./pages/AboutPage";
import AccountPage from "./pages/AccountPage";
import CustomerLogin from "./pages/CustomerLogin";
import AdminLogin from "./pages/AdminLogin";
import AdminPage from "./pages/AdminPage";
import EditProductPage from "./pages/EditProductPage";
import CreateProductPage from "./pages/CreateProductPage";
import HomePage from "./pages/HomePage";
import ProductPage from "./pages/ProductPage";
import { CartProvider } from "./context/CartContext";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./css/globals.css";
import ProtectedRoute from "./utils/ProtectedRoute";

function App() {
  return (
    <BrowserRouter>
      <CartProvider>
        <Navbar />

        <div className="page-container">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/products/:id" element={<ProductPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/account" element={<AccountPage />} />
            <Route path="/order" element={<OrderPage />} />
            <Route path="/login" element={<CustomerLogin />} />
            //ADMIN, ROUTE TO ADMIN/LOGIN IF UNAUTHORIZED WITH PROTECTED ROUTE
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <AdminPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/product/edit/:id"
              element={
                <ProtectedRoute>
                  <EditProductPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/product/create"
              element={
                <ProtectedRoute>
                  <CreateProductPage />
                </ProtectedRoute>
              }
            />
          </Routes>
        </div>
        <Footer />
      </CartProvider>
    </BrowserRouter>
  );
}

export default App;
