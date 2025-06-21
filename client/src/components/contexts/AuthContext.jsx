import React, { createContext, useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";

export const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

// Helper: Get cookie value by name (used for CSRF token)
const getCookie = (name) => {
  const cookies = document.cookie.split(";");
  for (let cookie of cookies) {
    const [key, value] = cookie.trim().split("=");
    if (key === name) return decodeURIComponent(value);
  }
  return null;
};

// Helper: Get all CSRF tokens (for different token types)
const getCSRFTokens = () => {
  return {
    access: getCookie("csrf_access_token"),
    refresh: getCookie("csrf_refresh_token"),
  };
};

// Helper: Debug function to log all cookies
const debugCookies = () => {
  console.log("All cookies:", document.cookie);
  const tokens = getCSRFTokens();
  console.log("CSRF tokens:", tokens);
  console.log("Access token cookie:", getCookie("access_token_cookie"));
  console.log("Refresh token cookie:", getCookie("refresh_token_cookie"));
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Get API base URL based on environment
  const getApiUrl = (endpoint) => {
    const baseUrl = import.meta.env.VITE_API_URL || "";
    return `${baseUrl}${endpoint}`;
  };

  // Get fetch options with proper credentials and CSRF tokens
  const getFetchOptions = (method = "GET", body = null, tokenType = "access") => {
    const tokens = getCSRFTokens();
    const csrfToken = tokenType === "refresh" ? tokens.refresh : tokens.access;

    const options = {
      method,
      credentials: "include", // CRITICAL: Always include cookies
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        // Add CSRF token if available
        ...(csrfToken && { "X-CSRF-TOKEN": csrfToken }),
      },
    };

    if (body) {
      options.body = typeof body === "string" ? body : JSON.stringify(body);
    }

    return options;
  };

  // Helper: fetch CSRF token and set cookies (no response body needed)
  const fetchCsrfToken = async () => {
    try {
      await fetch(getApiUrl("/api/csrf-token"), {
        method: "GET",
        credentials: "include",
      });
      debugCookies();
    } catch (error) {
      console.error("Failed to fetch CSRF token:", error);
    }
  };

  // Check if user is already logged in and initialize tokens
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const tokens = getCSRFTokens();
        if (!tokens.access && !tokens.refresh) {
          console.log("No CSRF tokens found, getting initial token...");
          await fetchCsrfToken();
        }

        debugCookies();

        const res = await fetch(getApiUrl("/api/user/profile"), getFetchOptions());

        if (res.ok) {
          const contentType = res.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const data = await res.json();
            setUser(data);
          } else {
            console.error("Profile endpoint returned non-JSON response");
            const responseText = await res.text();
            console.error("Response body:", responseText.substring(0, 200) + "...");
            setUser(null);
          }
        } else {
          console.log(`Profile fetch failed with status: ${res.status}`);
          const responseText = await res.text();
          console.error("Failed response body:", responseText.substring(0, 200) + "...");
          setUser(null);
        }
      } catch (err) {
        console.error("Error during auth initialization:", err);
        if (err.message.includes("Unexpected token")) {
          console.error("Server returned HTML instead of JSON - check if API server is running");
        }
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Refresh CSRF token when user is authenticated
  useEffect(() => {
    const refreshCSRFToken = async () => {
      if (user && !loading) {
        try {
          console.log("Attempting to refresh CSRF token...");
          debugCookies();

          const res = await fetch(
            getApiUrl("/api/refresh-token"),
            getFetchOptions("POST", null, "refresh")
          );

          if (res.ok) {
            console.log("✅ CSRF token refreshed");
          } else {
            console.error("❌ Error refreshing CSRF token - Status:", res.status);
            if (res.status === 401) {
              console.log("Token invalid - logging out user");
              await logout();
            }
          }
        } catch (error) {
          console.error("❌ Error refreshing CSRF token:", error);
        }
      }
    };

    if (user && !loading) {
      refreshCSRFToken();
    }
  }, [user, loading]);

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

      // Fetch CSRF token after successful login
      await fetchCsrfToken();

      navigate("/");
    } catch (error) {
      setUser(null);
      throw error;
    } finally {
      setLoading(false);
    }
  };

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

      // Fetch CSRF token after successful signup
      await fetchCsrfToken();

      navigate("/");
    } catch (error) {
      setUser(null);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      const res = await fetch(getApiUrl("/api/logout"), getFetchOptions("DELETE"));

      if (!res.ok) {
        throw new Error("Logout failed");
      }

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

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
