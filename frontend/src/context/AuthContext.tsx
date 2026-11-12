import { createContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import api from "../axios/api";

// WHO IS LOGGED IN?
// The JWT is in an httpOnly cookie, so React can't read it. Instead we ask the
// server once when the app starts (GET /api/auth/me), and share the answer here.

type AuthUser = {
  userId: number;
  email: string;
  role: "admin" | "customer";
};

type AuthContextType = {
  user: AuthUser | null; // null = guest
  loading: boolean; // true until the server has answered
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getUser() {
      try {
        const response = await api.get("/auth/me");
        setUser(response.data.user);

        // The guest cart was moved to the account at login, so the guest token is not needed
        if (response.data.user) {
          localStorage.removeItem("cartToken");
        }
      } catch (error) {
        console.error(error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    getUser();
  }, []);

  // React can't remove the httpOnly cookie itself – the server does it
  async function logout() {
    try {
      await api.post("/auth/logout");
    } catch (error) {
      console.error(error);
    }
    window.location.href = "/";
  }

  return (
    <AuthContext.Provider value={{ user, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthContext;
