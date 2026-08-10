import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { loginUser, logoutUser, getMe } from "../api/api";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("token") || "");
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("user");
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const me = await getMe();
      setUser(me);
      localStorage.setItem("user", JSON.stringify(me));
    } catch (err) {
      console.error("Auth check failed:", err);
      // Clear invalid token
      setToken("");
      setUser(null);
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const login = async (username, password) => {
    const data = await loginUser(username, password);
    if (data && data.access_token) {
      localStorage.setItem("token", data.access_token);
      localStorage.setItem("user", JSON.stringify(data.user));
      setToken(data.access_token);
      setUser(data.user);
      return data.user;
    }
    throw new Error("Authentication failed: invalid token response");
  };

  const logout = async () => {
    await logoutUser();
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken("");
    setUser(null);
    window.location.href = "/login";
  };

  const hasRole = (...allowedRoles) => {
    if (!user) return false;
    if (user.role === "ADMIN" || user.is_admin) return true;
    return allowedRoles.includes(user.role);
  };

  const canModify = () => hasRole("ADMIN", "INFRASTRUCTURE_MANAGER");
  const canOperate = () => hasRole("ADMIN", "INFRASTRUCTURE_MANAGER", "MONITORING_OPERATOR");
  const isAdmin = () => user?.role === "ADMIN" || user?.is_admin === true;

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        loading,
        login,
        logout,
        hasRole,
        canModify,
        canOperate,
        isAdmin,
        refetchProfile: fetchProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
