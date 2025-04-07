import React, { createContext, useState, useEffect } from 'react';
import { api } from '../../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if user is already logged in on page load


  const login = async (username, password) => {
    try {
      const userData = await api.post('/login', { username, password });
      setCurrentUser(userData);
      return userData;
    } catch (error) {
      console.error('Login error:', error);
      throw new Error(error.message || 'Failed to login');
    }
  };

  const signup = async (username, email, password) => {
    try {
      const userData = await api.post('/signup', { username, email, password });
      setCurrentUser(userData);
      return userData;
    } catch (error) {
      console.error('Signup error:', error);
      throw new Error(error.message || 'Failed to create account');
    }
  };

  const logout = async () => {
    try {
      // Perform logout API call
      const response = await api.delete('/logout');
  
      // Clear the current user regardless of the response body
      setCurrentUser(null);
  
      // Optionally redirect or show a toast here
      // e.g., navigate('/login'); or toast.success("Logged out");
  
      return response;
    } catch (error) {
      console.error('Logout error:', error);
      throw new Error(error.message || 'Failed to logout');
    }
  };

  // Handle Google OAuth redirect
  // This will typically be called in a useEffect in a component that handles the redirect
  const handleGoogleRedirect = async () => {
    try {
      // The backend handles the OAuth flow and returns user data
      // This is usually automatic via the redirect
      const userData = await api.get('/user/profile');
      setCurrentUser(userData);
      return userData;
    } catch (error) {
      console.error('Google auth error:', error);
      throw new Error(error.message || 'Failed to authenticate with Google');
    }
  };

  const value = {
    currentUser,
    loading,
    login,
    signup,
    logout,
    handleGoogleRedirect
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};