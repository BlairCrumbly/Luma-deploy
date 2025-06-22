import React, { createContext, useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";

export const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

// --------------------
// Helpers
// --------------------

// Get cookie value by name
const getCookie = (name) => {
  const cookies = document.cookie.split(";");
  for (let cookie of cookies) {
    const [key, value] = cookie.trim().split("=");
    if (key === name) return decodeURIComponent(value);
  }
  return null;
};

// Get all CSRF tokens (access and refresh)
const getCSRFTokens = () => ({
  access: getCookie("csrf_access_token"),
  refresh: getCookie("csrf_refresh_token"),
});

// Debug helper
const debugCookies = () => {
  console.log("All cookies:", document.cookie);
  console.log("CSRF tokens:", getCSRFTokens());
  console.log("Access token cookie:", getCookie("access_token_cookie"));
  console.log("Refresh token cookie:", getCookie("refresh_token_cookie"));
};

// Get base API URL from .env or default
const getApiUrl = (endpoint) => {
  const baseUrl = import.meta.env.VITE_API_URL || "";
  return `${baseUrl}${endpoint}`;
};

// Build fetch options with credentials and CSRF token
const getFetchOptions = (method = "GET", body = null, tokenType = "access") => {
  const csrfToken = tokenType === "refresh"
    ? getCSRFTokens().refresh
    : getCSRFTokens().access;

  const headers = {
    "Accept": "application/json",
    "Content-Type": "application/json",
    ...(csrfToken && { "X-CSRF-TOKEN": csrfToken }),
  };

  const options = {
    method,
    credentials: "include",
    headers,
  };

  if (body) {
    options.body = typeof body === "string" ? body : JSON.stringify(body);
  }

  return options;
};

// --------------------
// Auth Provider
// --------------------

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Fetch CSRF token explicitly
  const fetchCsrfToken = async () => {
    try {
      await fetch(getApiUrl("/api/csrf-token"), {
        method: "GET",
        credentials: "include",
      });
      debugCookies();
    } catch (error) {
      console.error("❌ Failed to fetch CSRF token:", error);
    }
  };

  // Initialize session on app load
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const tokens = getCSRFTokens();
        if (!tokens.access && !tokens.refresh) {
          console.log("No CSRF tokens found. Fetching new one...");
          await fetchCsrfToken();
        }

        const res = await fetch(getApiUrl("/api/user/profile"), getFetchOptions());

        if (res.ok && res.headers.get("content-type")?.includes("application/json")) {
          const data = await res.json();
          setUser(data);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Auto-refresh token after login
  useEffect(() => {
    const refreshToken = async () => {
      if (!user || loading) return;

      try {
        console.log("🔄 Attempting CSRF token refresh...");
        const res = await fetch(
          getApiUrl("/api/refresh-token"),
          getFetchOptions("POST", null, "refresh")
        );

        if (res.ok) {
          console.log("✅ CSRF token refreshed");
        } else if (res.status === 401) {
          console.warn("🔒 Token expired — logging out.");
          await logout();
        } else {
          console.error("⚠️ Refresh token failed:", res.status);
        }
      } catch (error) {
        console.error("❌ Refresh CSRF error:", error);
      }
    };

    refreshToken();
  }, [user, loading]);

  // --------------------
  // Login
  // --------------------
  const login = async (username, password) => {
    setLoading(true);
    try {
      const res = await fetch(
        getApiUrl("/api/login"),
        getFetchOptions("POST", { username, password })
      );

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Login failed");
      }

      const userData = await res.json();
      setUser(userData);

      // Fetch fresh CSRF token after login
      await fetchCsrfToken();

      navigate("/");
    } catch (error) {
      setUser(null);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // --------------------
  // Signup
  // --------------------
  const signup = async (username, email, password) => {
    setLoading(true);
    try {
      const res = await fetch(
        getApiUrl("/api/signup"),
        getFetchOptions("POST", { username, email, password })
      );

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Signup failed");
      }

      const userData = await res.json();
      setUser(userData);

      // Fetch CSRF token after signup
      await fetchCsrfToken();

      navigate("/");
    } catch (error) {
      setUser(null);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // --------------------
  // Logout
  // --------------------
  const logout = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        getApiUrl("/api/logout"),
        getFetchOptions("DELETE")
      );

      if (!res.ok) throw new Error("Logout failed");

      setUser(null);
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
      setUser(null);
      navigate("/login");
    } finally {
      setLoading(false);
    }
  };

  const value = {
    currentUser: user,
    loading,
    login,
    signup,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
