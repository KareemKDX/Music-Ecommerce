import { useState } from "react";
import api from "../axios/api";
import "../css/AdminLogin.css";
import { NavLink, useSearchParams } from "react-router-dom";

function CustomerLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  // ?redirect=/order -> go back to checkout after login. Only links inside our own site
  const [searchParams] = useSearchParams();
  const redirectParam = searchParams.get("redirect");
  const redirect =
    redirectParam?.startsWith("/") && !redirectParam.startsWith("//")
      ? redirectParam
      : "/";

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    //POST LOGIN DATA TO DATABASE
    try {
      const response = await api.post("/customer/login", {
        email,
        password,
      });

      const data = await response.data;
      localStorage.setItem("token", data.token);
      // The guest cart now belongs to the user, so the guest token is not needed
      localStorage.removeItem("cartToken");
      console.log("Logged in:", data);
      window.location.href = redirect;
    } catch (error) {
      console.error(error);
      setError("Error loggin in to server. ");
    }
  }

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-card">
          <div className="login-box-left">
            <div className="login-header">
              <h1>Login</h1>
              <p>Sign in to continue</p>
            </div>
          </div>
          <div className="login-box-right">
            <div className="input-group">
              <form onSubmit={handleLogin}>
                <div className="input-field-login">
                  <label htmlFor="email">E-mail</label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="input-field-login">
                  <label htmlFor="password">Password</label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>

                <button className="login-btn " type="submit">
                  Login
                </button>
              </form>
              <NavLink
                className="create-account-btn"
                to={"/register?redirect=" + redirect}
              >
                Create new account
              </NavLink>
              <NavLink className="admin-login-btn" to="/admin/login">
                Admin account? Press here to login.
              </NavLink>
            </div>

            {error && <p>{error}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

export default CustomerLogin;
