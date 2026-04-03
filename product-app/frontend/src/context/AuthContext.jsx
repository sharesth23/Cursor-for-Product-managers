import { createContext, useContext, useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { useNavigate, useLocation } from "react-router-dom";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Migration logic for old non-JWT auth state
    const oldId = localStorage.getItem("last-open-project-id");
    const token = localStorage.getItem("auth-token");
    
    if (oldId && !token) {
       // Clear potential stale state from before we added JWT architecture
       localStorage.removeItem("last-open-project-id");
    }

    if (token) {
      try {
        const decoded = jwtDecode(token);
        // Expiry check
        if (decoded.exp * 1000 < Date.now()) {
          logout();
        } else {
          setUser(decoded);
        }
      } catch (err) {
        logout();
      }
    }
    setLoading(false);
  }, []);

  const login = (token) => {
    localStorage.setItem("auth-token", token);
    const decoded = jwtDecode(token);
    setUser(decoded);
    
    if (decoded.role === "super_admin") {
      navigate("/super-admin/dashboard");
    } else {
      navigate(`/${decoded.company_slug}/dashboard`);
    }
  };

  const logout = () => {
    localStorage.removeItem("auth-token");
    setUser(null);
    if (!location.pathname.includes("/login") && !location.pathname.includes("/signup")) {
      navigate("/login");
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
