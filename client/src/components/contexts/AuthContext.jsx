import React, { createContext, useState, useEffect, useCallback } from 'react';
import Cookies from 'js-cookie';


export const AuthContext = createContext();
const API_URL = import.meta.env.VITE_API_URL;

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Function to refresh the token
  const refreshToken = useCallback(async () => {
    if (refreshing) return false;
    
    try {
      setRefreshing(true);
      const csrfToken = Cookies.get('csrf_refresh_token');
      
      if (!csrfToken) {
        console.error('No CSRF refresh token found');
        return false;
      }
      
      const response = await fetch(`${API_URL}/api/refresh-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': csrfToken,
        },
        credentials: 'include',  // Important for cookies
      });
      
      if (!response.ok) {
        console.error('Token refresh failed:', response.status);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Token refresh error:', error);
      return false;
    } finally {
      setRefreshing(false);
    }
  }, [refreshing]);
  
  // Function to fetch user profile with auto-refresh capability
  const fetchCurrentUser = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/user/profile`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (response.status === 401) {
        // Token expired, try to refresh
        console.log('Authentication token expired, attempting refresh...');
        const refreshed = await refreshToken();
        if (refreshed) {
          // Try again with the new token
          console.log('Token refreshed successfully, retrying fetch');
          return await fetchCurrentUser();
        } else {
          console.log('Token refresh failed, user not authenticated');
          setCurrentUser(null);
          return null;
        }
      }
      
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
  }, [refreshToken]);

  // Initial auth check
  useEffect(() => {
    const checkAuth = async () => {
      await fetchCurrentUser();
      setLoading(false);
    };
    
    checkAuth();
  }, [fetchCurrentUser]);

  //! Set up token refresh interval
  useEffect(() => {

    const refreshInterval = setInterval(() => {
      if (currentUser) {
        console.log('Performing scheduled token refresh');
        refreshToken();
      }
    }, 45 * 60 * 1000); // 45 minutes
    
    return () => clearInterval(refreshInterval);
  }, [currentUser, refreshToken]);

  // LOGIN
  const login = async (username, password) => {
    try {
      const response = await fetch(`${API_URL}/api/login`, {
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

  // SIGNUP
  const signup = async (username, email, password) => {
    try {
      const response = await fetch(`${API_URL}/api/signup`, {
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

  //! Handle Google OAuth redirect
  const handleGoogleRedirect = async () => {
    try {
      console.log('Handling Google OAuth redirect');
      return await fetchCurrentUser();
    } catch (error) {
      console.error('Google redirect handling failed:', error);
      throw error;
    }
  };

  //! LOGOUT
  const logout = async () => {
    try {
      const csrfToken = Cookies.get('csrf_access_token');
      
      if (!csrfToken) {
        console.error('No CSRF access token found for logout');
        setCurrentUser(null);
        return;
      }
      
      const response = await fetch(`${API_URL}/api/logout`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': csrfToken,
        },
        credentials: 'include',
      });
      
      if (!response.ok) {
        console.error('Logout request failed:', response.status);
      }
      
      setCurrentUser(null);
    } catch (error) {
      console.error('Logout failed:', error);
      // Still clear user state on error
      setCurrentUser(null);
    }
  };

  const value = {
    currentUser,
    loading,
    login,
    signup,
    logout,
    handleGoogleRedirect,
    fetchCurrentUser,
    refreshToken
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;