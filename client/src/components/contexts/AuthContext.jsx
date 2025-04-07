import React, { createContext, useState, useEffect } from 'react';
import { api } from '../../services/api';
import Cookies from 'js-cookie'; // For reading cookies
import { useCallback } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Function to fetch the current user profile
  const fetchCurrentUser = async () => {
    try {
      const response = await fetch('/api/user/profile', {
        credentials: 'include' // Important for cookies
      });
      
      if (!response.ok) {
        console.error('Failed to fetch user profile:', response.status);
        return null;
      }
      
      const userData = await response.json();
      setCurrentUser(userData);
      return userData;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  };

  // Google OAuth redirect handler
  const handleGoogleRedirect = async () => {
    try {
      return await fetchCurrentUser(); // Simply use the fetchCurrentUser function
    } catch (error) {
      console.error('Google redirect handling failed:', error);
      throw error;
    }
  };

  // Initial auth check
  useEffect(() => {
    const checkAuth = async () => {
      await fetchCurrentUser();
      setLoading(false);
    };
    
    checkAuth();
  }, []);

  // Login function
  const login = async (username, password) => {
    try {
      const csrfToken = Cookies.get('csrf_access_token'); 
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
        credentials: 'include',
        'X-CSRF-TOKEN': csrfToken
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Login failed');
      }
      
      const userData = await response.json();
      setCurrentUser(userData);
      return userData;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  // Logout function
  const logout = async () => {
    try {
      const csrfToken = Cookies.get('csrf_access_token');  // Get CSRF token from cookies
  
      const response = await fetch('/api/logout', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': csrfToken,  // Include CSRF token
        },
        credentials: 'include',  // Include cookies in the request
      });
  
      if (!response.ok) {
        throw new Error('Logout failed');
      }
  
      setCurrentUser(null);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };
  

  const value = {
    currentUser,
    setCurrentUser,
    loading,
    login,
    logout,
    handleGoogleRedirect,
    fetchCurrentUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
