import React, { createContext, useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";


export const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

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

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch("/api/profile", {
          method: "GET",
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          setUser(data);
        } else {
          setUser(null);
        }
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const login = async (credentials) => {
    setLoading(true);
    try {
      const csrfToken = getCookie("csrf_access_token");

      const res = await fetch("/api/login", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-TOKEN": csrfToken,
        },
        body: JSON.stringify(credentials),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Login failed");
      }

      const profileRes = await fetch("/api/profile", {
        method: "GET",
        credentials: "include",
      });

      if (!profileRes.ok) throw new Error("Failed to fetch user profile");

      const userData = await profileRes.json();
      setUser(userData);
      navigate("/dashboard");
    } catch (error) {
      setUser(null);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (data) => {
    setLoading(true);
    try {
      const csrfToken = getCookie("csrf_access_token");

      const res = await fetch("/api/signup", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-TOKEN": csrfToken,
        },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Signup failed");
      }

      const profileRes = await fetch("/api/profile", {
        method: "GET",
        credentials: "include",
      });

      if (!profileRes.ok) throw new Error("Failed to fetch profile after signup");

      const userData = await profileRes.json();
      setUser(userData);
      navigate("/dashboard");
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
          "X-CSRF-TOKEN": csrfToken,
        },
      });

      if (!res.ok) throw new Error("Logout failed");

      setUser(null);
      navigate("/login");
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
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
