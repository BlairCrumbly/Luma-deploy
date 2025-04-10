import React, { createContext, useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import { useCallback } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  
  const fetchCurrentUser = async () => {
    try {
      const response = await fetch('/api/user/profile', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        console.error('Failed to fetch user profile:', response.status);
        setCurrentUser(null);
        return null;
      }
      
      const userData = await response.json();
      setCurrentUser(userData);
      return userData;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setCurrentUser(null);
      return null;
    }
  };

  //! Initial auth check
  useEffect(() => {
    const checkAuth = async () => {
      await fetchCurrentUser();
      setLoading(false);
    };
    
    checkAuth();
  }, []);

  //!LOGIN
  const login = async (username, password) => {
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
        credentials: 'include',
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

  //! SIGNUP
  const signup = async (username, email, password) => {
    try {
      const response = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password }),
        credentials: 'include',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Signup failed');
      }
      
      const userData = await response.json();
      setCurrentUser(userData);
      return userData;
    } catch (error) {
      console.error('Signup failed:', error);
      throw error;
    }
  };

  //! Handle Google Oauth redirect
  const handleGoogleRedirect = async () => {
    try {
      return await fetchCurrentUser();
    } catch (error) {
      console.error('Google redirect handling failed:', error);
      throw error;
    }
  };

  //! LOGOUT
  const logout = async () => {
    try {
      const csrfToken = Cookies.get('csrf_access_token');  // Get CSRF token from cookies
  
      const response = await fetch('/api/logout', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': csrfToken,
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
    loading,
    login,
    signup,
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
