// "Continue with Google" – a normal link, not axios: the whole page has to go to the
// backend, which sends the user on to Google. See backend/src/routes/auth.ts
function GoogleLoginButton({ redirect }: { redirect: string }) {
  // Send the guest cart along, so the backend can move it to the account (same as normal login)
  const cartToken = localStorage.getItem("cartToken") ?? "";
  const params = new URLSearchParams({ redirect, cartToken });

  return (
    <>
      <div className="login-divider">or</div>
      <a
        className="google-login-btn"
        href={`${import.meta.env.VITE_API_URL}/auth/google?${params}`}
      >
        <span className="google-login-icon">G</span>
        Continue with Google
      </a>
    </>
  );
}

export default GoogleLoginButton;
