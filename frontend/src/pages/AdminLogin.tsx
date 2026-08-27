import { useState } from "react";
import api from "../axios/api";
import "../css/AdminLogin.css";

function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    //POST LOGIN DATA TO DATABASE
    try {
      const response = await api.post("/admin/login", {
        email,
        password,
      });

      const data = await response.data;
      localStorage.setItem("token", data.token);
      console.log("Logged in:", data);
      window.location.href = "/admin";
    } catch (error) {
      console.error(error);
      setError("Wrong email or password. Try again. ");
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-box-left">
          <div className="login-header">
            <h1>Admin Login</h1>
            <p>Sign in to continue</p>
          </div>
        </div>
        <div className="login-box-right">
          <div className="input-group">
            <form onSubmit={handleLogin}>
              <div>
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div>
                <label htmlFor="password">Lösenord</label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <button className="login-btn " type="submit">
                Logga in
              </button>
            </form>
          </div>

          {error && <p>{error}</p>}
        </div>
      </div>
    </div>
  );
}

export default AdminLogin;
