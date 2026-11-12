import { useContext } from "react";
import { Navigate } from "react-router-dom";
import AuthContext from "../context/AuthContext";
import Loading from "../components/Loading";

// ONLY ADMINS GET IN. The server checks it too – this only decides what React shows.
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const auth = useContext(AuthContext);

  if (!auth) {
    throw new Error("ProtectedRoute must be used inside AuthProvider");
  }

  // Wait until the server has said who is logged in
  if (auth.loading) {
    return <Loading />;
  }

  if (auth.user?.role !== "admin") {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
}

export default ProtectedRoute;
