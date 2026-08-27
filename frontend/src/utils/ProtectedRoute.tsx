import { Navigate } from "react-router-dom";
import { isTokenValid } from "../utils/isTokenValid";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem("token");

  if (!isTokenValid(token)) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
}

export default ProtectedRoute;
