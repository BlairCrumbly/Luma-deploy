// client/src/contexts/AuthContext.jsx
import React, { createContext, useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { api, initializeCSRF } from "../../services/api";

export const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Initialize authentication on app load
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // First, initialize CSRF token
        await initializeCSRF();
        
        // Then try to get user profile
        const userData = await api.get("/api/user/profile");
        
        if (userData && userData.id) {
          setUser(userData);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
        setUser(null);
        
        // If it's an auth error, don't redirect immediately
        // Let the user try to log in first
        if (!error.message.includes('Authentication required')) {
          console.error("Unexpected auth initialization error:", error);
        }
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Auto-refresh token periodically
  useEffect(() => {
    if (!user || loading) return;

    const refreshInterval = setInterval(async () => {
      try {
        console.log("🔄 Auto-refreshing token...");
        await api.post("/api/refresh-token");
        console.log("✅ Token auto-refreshed");
      } catch (error) {
        console.error("❌ Auto-refresh failed:", error);
        
        // If refresh fails with auth error, log user out
        if (error.message.includes('Authentication') || error.message.includes('401')) {
          console.warn("🔒 Token expired — logging out.");
          await logout();
        }
      }
    }, 15 * 60 * 1000); // Refresh every 15 minutes

    return () => clearInterval(refreshInterval);
  }, [user, loading]);

  // --------------------
  // Login
  // --------------------
  const login = async (username, password) => {
    setLoading(true);
    try {
      const userData = await api.post("/api/login", { username, password });
      
      if (userData && userData.user) {
        setUser(userData.user);
        navigate("/");
        return userData;
      } else {
        throw new Error("Invalid response from server");
      }
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
      const userData = await api.post("/api/signup", { username, email, password });
      
      if (userData && userData.user) {
        setUser(userData.user);
        navigate("/");
        return userData;
      } else {
        throw new Error("Invalid response from server");
      }
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
      await api.post("/api/logout");
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

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};