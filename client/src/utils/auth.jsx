

import React, { createContext, useState, useEffect, useContext } from "react";
import { useHistory } from "react-router-dom";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); 
  const history = useHistory();

  useEffect(() => {
    const token = localStorage.getItem("token"); 
    if (token) {
      setUser({ token });
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, []);

  const login = (userData) => {
    setUser(userData);
    localStorage.setItem("token", userData.token);
    history.push("/dashboard");
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("token");
    history.push("/login");
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
