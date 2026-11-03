import { useState } from "react";
import { isAxiosError } from "axios";
import api from "../axios/api";
import "../css/AdminLogin.css";
import { NavLink } from "react-router-dom";

function CustomerRegister() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);

    //POST NEW CUSTOMER, LOG IN DIRECTLY WITH RETURNED TOKEN
    try {
      const response = await api.post("/customer/register", {
        username,
        email,
        password,
      });

      localStorage.setItem("token", response.data.token);
      window.location.href = "/";
    } catch (error) {
      console.error(error);
      const message = isAxiosError(error)
        ? error.response?.data?.message
        : undefined;
      setError(message ?? "Could not create account.");
      setSubmitting(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-card register-card">
          <div className="login-box-left">
            <div className="login-header">
              <h1>Create account</h1>
              <p>Sign up to start shopping!</p>
            </div>
          </div>
          <div className="login-box-right">
            <div className="input-group">
              <form onSubmit={handleRegister}>
                <div className="input-field-login">
                  <label htmlFor="username">Username</label>
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    minLength={2}
                    maxLength={100}
                    required
                  />
                </div>

                <div className="input-field-login">
                  <label htmlFor="email">Email</label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    maxLength={200}
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
                    minLength={6}
                    required
                  />
                </div>

                <div className="input-field-login">
                  <label htmlFor="confirm-password">Repeat password</label>
                  <input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    minLength={6}
                    required
                  />
                </div>

                <button
                  className="login-btn"
                  type="submit"
                  disabled={submitting}
                >
                  {submitting ? "Creating account..." : "Create account"}
                </button>
              </form>
              <NavLink className="admin-login-btn" to="/login">
                Already have an account? Press here to login.
              </NavLink>

              {error && <p>{error}</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CustomerRegister;
