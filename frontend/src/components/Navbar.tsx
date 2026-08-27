import React, { useState, useContext } from "react";
import "../css/Navbar.css";
import CartContext from "../context/CartContext";
import Cart from "./Cart";
import { NavLink } from "react-router-dom";
import { isTokenValid } from "../utils/isTokenValid";
import { getTokenRole } from "../utils/getTokenRole";
import { accountLogout } from "../utils/adminLogout";

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
        <div className="navbar-logo">
          <span>SPEXAH</span>
        </div>

        <button
          className={`navbar-toggle ${menuOpen ? "open" : ""}`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle navigation"
        >
          <span className="toggle-bar"></span>
          <span className="toggle-bar"></span>
          <span className="toggle-bar"></span>
        </button>

        <div className={`navbar-links ${menuOpen ? "open" : ""}`}>
          <NavLink to="/">Products</NavLink>
          <NavLink to="/about">About</NavLink>

          {isLoggedIn && role === "admin" && (
            <NavLink to="/admin">Admin Dashboard</NavLink>
          )}
          {isLoggedIn && role === "customer" && (
            <NavLink to="/account">My account</NavLink>
          )}

          {isLoggedIn && <button onClick={accountLogout}>Logout</button>}

          {!isLoggedIn && (
            <>
              <NavLink to="/admin/login">Admin Login</NavLink>
              <NavLink to="/login">Customer Login</NavLink>
            </>
          )}
        </div>

        <div className="cart-wrapper">
          <button
            className="cart-button"
            onClick={() => setCartOpen(!cartOpen)}
          >
            🛒
            {cartAmount > 0 && <span className="cart-count">{cartAmount}</span>}
          </button>

          {cartOpen && (
            <div className="cart-dropdown">
              <Cart />
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
