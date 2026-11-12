import { useState } from "react";
import api from "../axios/api";
import "../css/AdminLogin.css";
import { NavLink, useSearchParams } from "react-router-dom";
import GoogleLoginButton from "../components/GoogleLoginButton";

// ?error=… FROM THE BACKEND WHEN GOOGLE LOGIN FAILS (backend/src/routes/auth.ts)
const googleErrors: Record<string, string> = {
  cancelled: "Google login was cancelled.",
  "not-verified": "Your Google email is not verified.",
  admin: "Admin accounts can't log in with Google. Use the admin login.",
  "email-exists":
    "An account with this email already exists. Log in with your email and password.",
  google: "Could not log in with Google. Please try again.",
};

function CustomerLogin() {
  const [searchParams] = useSearchParams();
  const errorParam = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(
    errorParam ? (googleErrors[errorParam] ?? googleErrors.google) : "",
  );

  // ?redirect=/order -> go back to checkout after login. Only links inside our own site
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

      // The server put the JWT in an httpOnly cookie – React never sees the token
      console.log("Logged in:", response.data.user);
      // The guest cart now belongs to the user, so the guest token is not needed
      localStorage.removeItem("cartToken");
      window.location.href = redirect;
    } catch (error) {
      console.error(error);
      setError("Incorrect email & password. Try again. ");
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
                {error && <p className="error-text">{error}</p>}
                <button className="login-btn " type="submit">
                  Login
                </button>
              </form>
              <GoogleLoginButton redirect={redirect} />
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
          </div>
        </div>
      </div>
    </div>
  );
}

export default CustomerLogin;
