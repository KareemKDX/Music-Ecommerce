import { useEffect, useRef, useState } from "react";
import { NavLink, useSearchParams } from "react-router-dom";
import api from "../axios/api";
import Loading from "../components/Loading";
import "../css/AdminLogin.css";

// THE BACKEND SENDS THE USER HERE AFTER GOOGLE LOGIN: /auth/google?code=…&redirect=/order
// We send the one-time code to the server, which sets the normal httpOnly login cookie –
// after that it works exactly like normal login.
function GoogleCallback() {
  const [searchParams] = useSearchParams();
  const [error, setError] = useState("");
  // React StrictMode runs effects twice in dev – the code should only be used once
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const code = searchParams.get("code");
    const redirectParam = searchParams.get("redirect");
    // Only links inside our own site
    const redirect =
      redirectParam?.startsWith("/") && !redirectParam.startsWith("//")
        ? redirectParam
        : "/";

    async function exchangeCode() {
      try {
        await api.post("/auth/google/exchange", { code });

        // SAME AS CustomerLogin.tsx
        // The guest cart now belongs to the user, so the guest token is not needed
        localStorage.removeItem("cartToken");
        window.location.href = redirect;
      } catch (error) {
        console.error(error);
        setError("Could not log in with Google. Please try again.");
      }
    }

    exchangeCode();
  }, [searchParams]);

  if (!error) {
    return <Loading />;
  }

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-card">
          <div className="login-box-right">
            <div className="input-group">
              <p>{error}</p>
              <NavLink className="create-account-btn" to="/login">
                Back to login
              </NavLink>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GoogleCallback;
