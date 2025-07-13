// client/src/components/contexts/AuthContext.jsx
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
        // First, try to get user profile (this will work if user is already logged in)
        try {
          const userData = await api.get("/api/user/profile");
          if (userData && userData.id) {
            setUser(userData);
            setLoading(false);
            return; // User is already authenticated, no need to initialize CSRF
          }
        } catch (error) {
          // If profile fetch fails, user is not authenticated
          console.log("User not authenticated, initializing CSRF...");
        }

        // Initialize CSRF token for unauthenticated users
        await initializeCSRF();
        setUser(null);
        
      } catch (error) {
        console.error("Error initializing auth:", error);
        setUser(null);
        
        // Try to initialize CSRF even if there's an error
        try {
          await initializeCSRF();
        } catch (csrfError) {
          console.error("Failed to initialize CSRF:", csrfError);
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

  // Login function
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
      
      // If login fails due to CSRF, try to reinitialize and retry once
      if (error.message.includes('CSRF')) {
        try {
          console.log("🔄 Reinitializing CSRF and retrying login...");
          await initializeCSRF();
          const userData = await api.post("/api/login", { username, password });
          
          if (userData && userData.user) {
            setUser(userData.user);
            navigate("/");
            return userData;
          }
        } catch (retryError) {
          console.error("Login retry failed:", retryError);
          throw retryError;
        }
      }
      
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Signup function
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
      
      // If signup fails due to CSRF, try to reinitialize and retry once
      if (error.message.includes('CSRF')) {
        try {
          console.log("🔄 Reinitializing CSRF and retrying signup...");
          await initializeCSRF();
          const userData = await api.post("/api/signup", { username, email, password });
          
          if (userData && userData.user) {
            setUser(userData.user);
            navigate("/");
            return userData;
          }
        } catch (retryError) {
          console.error("Signup retry failed:", retryError);
          throw retryError;
        }
      }
      
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    setLoading(true);
    try {
      await api.post("/api/logout");
      setUser(null);
      
      // Reinitialize CSRF token for next login
      await initializeCSRF();
      
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
      setUser(null);
      
      // Reinitialize CSRF token even if logout fails
      try {
        await initializeCSRF();
      } catch (csrfError) {
        console.error("Failed to reinitialize CSRF after logout:", csrfError);
      }
      
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
    setUser, // Expose setUser for OAuth handling
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};