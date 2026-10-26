import React, { useState, useContext } from "react";
import "../css/Navbar.css";
import CartContext from "../context/CartContext";
import Cart from "./Cart";
import { NavLink } from "react-router-dom";
import CurrencySelector from "./CurrencySelector";
import { isTokenValid } from "../utils/isTokenValid";
import { getTokenRole } from "../utils/getTokenRole";
import { accountLogout } from "../utils/adminLogout";
import { ShoppingCart } from "lucide-react";

const Navbar: React.FC = () => {
  const [cartOpen, setCartOpen] = useState(false);
  const token = localStorage.getItem("token");
  const isLoggedIn = isTokenValid(token);
  const role = getTokenRole(token);

  const context = useContext(CartContext);

  const [menuOpen, setMenuOpen] = useState(false);

  if (!context) {
    throw new Error("Navbar måste användas inuti CartProvider");
  }

  const { cart } = context;

  const cartAmount = cart.reduce((total, item) => total + item.quantity, 0);

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="nav-left">
          <NavLink to="/" className="navbar-logo">
            <span className="logo-mark">S</span>
            <span className="logo-text">
              SPEXAH<span className="logo-text-sub"> Instruments</span>
            </span>
          </NavLink>
        </div>

        <div
          className={`navbar-links ${menuOpen ? "open" : ""}`}
          onClick={() => setMenuOpen(false)}
        >
          <div className="nav-link-center">
            <NavLink to="/" end>
              Products
            </NavLink>
            <NavLink to="/about">About</NavLink>
          </div>

          <div className="nav-right-container">
            {isLoggedIn && role === "admin" && (
              <NavLink to="/admin">Admin Dashboard</NavLink>
            )}
            {isLoggedIn && role === "customer" && (
              <NavLink to="/account">My account</NavLink>
            )}

            {isLoggedIn && (
              <button className="btn-logout" onClick={accountLogout}>
                Logout
              </button>
            )}

            {!isLoggedIn && (
              <NavLink className="login-btn-nav" to="/login">
                Login
              </NavLink>
            )}
          </div>
        </div>

        <div className="nav-actions">
          <CurrencySelector />

          <div className="cart-wrapper">
            <button
              className="cart-button"
              onClick={() => {
                setCartOpen(!cartOpen);
                setMenuOpen(false);
              }}
              aria-label="Open cart"
            >
              <ShoppingCart size={22} strokeWidth={2} />
              {cartAmount > 0 && (
                <span className="cart-count">{cartAmount}</span>
              )}
            </button>

            {cartOpen && (
              <div className="cart-dropdown">
                <Cart />
              </div>
            )}
          </div>

          <button
            className={`navbar-toggle ${menuOpen ? "open" : ""}`}
            onClick={() => {
              setMenuOpen(!menuOpen);
              setCartOpen(false);
            }}
            aria-label="Toggle navigation"
            aria-expanded={menuOpen}
          >
            <span className="toggle-bar"></span>
            <span className="toggle-bar"></span>
            <span className="toggle-bar"></span>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
