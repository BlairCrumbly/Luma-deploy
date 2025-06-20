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

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Check if user is already logged in
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch("/api/user/profile", {
          method: "GET",
          credentials: "include",
          headers: {
            "Accept": "application/json",
            "Content-Type": "application/json",
          },
        });
        
        if (res.ok) {
          // Check if response is actually JSON
          const contentType = res.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const data = await res.json();
            setUser(data);
          } else {
            console.error("Profile endpoint returned non-JSON response");
            setUser(null);
          }
        } else {
          console.log(`Profile fetch failed with status: ${res.status}`);
          setUser(null);
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
        // Check if it's a JSON parsing error
        if (err.message.includes("Unexpected token")) {
          console.error("Server returned HTML instead of JSON - check if API server is running");
        }
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  // Refresh CSRF token when user is authenticated
  useEffect(() => {
    const refreshCSRFToken = async () => {
      if (user && !loading) {
        try {
          const res = await fetch("/api/refresh-token", {
            method: "POST",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
            },
          });

          if (res.ok) {
            console.log("✅ CSRF token refreshed");
          } else {
            console.error("❌ Error refreshing CSRF token - Status:", res.status);
            
            // Handle different error scenarios
            if (res.status === 401) {
              // Token is invalid, user needs to re-authenticate
              console.log("Token invalid - logging out user");
              await logout();
            }
          }
        } catch (error) {
          console.error("❌ Error refreshing CSRF token:", error);
        }
      }
    };

    // Only refresh CSRF token if user is authenticated and not loading
    if (user && !loading) {
      refreshCSRFToken();
    }
  }, [user, loading]);

  const login = async (username, password) => {
    setLoading(true);
    try {
      const csrfToken = getCookie("csrf_access_token");

      const res = await fetch("/api/login", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(csrfToken && { "X-CSRF-TOKEN": csrfToken }),
        },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Login failed");
      }

      const userData = await res.json();
      setUser(userData);
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
      const csrfToken = getCookie("csrf_access_token");

      const res = await fetch("/api/signup", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(csrfToken && { "X-CSRF-TOKEN": csrfToken }),
        },
        body: JSON.stringify({ username, email, password }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Signup failed");
      }

      const userData = await res.json();
      setUser(userData);
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
      const csrfToken = getCookie("csrf_access_token");

      const res = await fetch("/api/logout", {
        method: "DELETE",
        credentials: "include",
        headers: {
          ...(csrfToken && { "X-CSRF-TOKEN": csrfToken }),
        },
      });

      if (!res.ok) {
        throw new Error("Logout failed");
      }

      setUser(null);
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
      // Even if logout fails on server, clear local state
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