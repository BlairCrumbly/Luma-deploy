// API service wrapper for making HTTP requests
const BASE = import.meta.env.VITE_API_URL || '';

// Helper function to get JWT token from localStorage
const getAuthToken = () => {
  return localStorage.getItem('authToken') || localStorage.getItem('access_token') || sessionStorage.getItem('authToken');
};

export const api = {
  // GET request
  async get(endpoint) {
    try {
      const token = getAuthToken();
      console.log(`Making GET request to: ${BASE}/api${endpoint}`);
      console.log(`Token exists: ${!!token}`);
      
      const headers = {
        'Content-Type': 'application/json',
      };
      
      // Add JWT token if available
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(`${BASE}/api${endpoint}`, {
        method: 'GET',
        credentials: 'include', // Keep for any other cookies
        headers
      });

      console.log(`Response status: ${response.status}`);

      // For 404 errors with new users, return empty array instead of throwing
      if (response.status === 404) {
        console.log(`Endpoint ${endpoint} not found, returning empty array`);
        return [];
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error(`GET ${endpoint} error response:`, errorData);
        throw new Error(errorData.error || `Request failed with status ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`GET ${endpoint} error:`, error);
      throw error;
    }
  },

  // POST request
  async post(endpoint, data) {
    try {
      const token = getAuthToken();
      console.log(`Making POST request to: ${BASE}/api${endpoint}`);
      console.log(`Token exists: ${!!token}`);
      console.log(`Request data:`, data);

      const headers = {
        'Content-Type': 'application/json',
      };
      
      // Add JWT token if available
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${BASE}/api${endpoint}`, {
        method: 'POST',
        credentials: 'include',
        headers,
        body: JSON.stringify(data),
      });

      console.log(`Response status: ${response.status}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error(`POST ${endpoint} error response:`, errorData);
        throw new Error(errorData.error || `Request failed with status ${response.status}`);
      }

      const result = await response.json();
      console.log(`POST ${endpoint} success:`, result);
      return result;
    } catch (error) {
      console.error(`POST ${endpoint} error:`, error);
      throw error;
    }
  },

  async put(endpoint, data) {
    try {
      const token = getAuthToken();
      console.log(`Making PUT request to: ${BASE}/api${endpoint}`);
      
      const headers = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
  
      const response = await fetch(`${BASE}/api${endpoint}`, {
        method: 'PUT',
        credentials: 'include',
        headers,
        body: JSON.stringify(data),
      });
  
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Request failed with status ${response.status}`);
      }
  
      return await response.json();
    } catch (error) {
      console.error(`PUT ${endpoint} error:`, error);
      throw error;
    }
  },

  // PATCH request
  async patch(endpoint, data) {
    try {
      const token = getAuthToken();
      
      const headers = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${BASE}/api${endpoint}`, {
        method: 'PATCH',
        credentials: 'include',
        headers,
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Request failed with status ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`PATCH ${endpoint} error:`, error);
      throw error;
    }
  },

  // DELETE request
  async delete(endpoint) {
    try {
      const token = getAuthToken();
      
      const headers = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
  
      const options = {
        method: 'DELETE',
        credentials: 'include',
        headers,
      };
  
      const apiUrl = `${BASE}/api${endpoint}`;
      const response = await fetch(apiUrl, options);
  
      if (!response.ok) {
        if (response.status === 404) {
          return null; // Return null for 404 errors
        }
        const errorText = await response.text();
        const errorData = errorText ? JSON.parse(errorText) : {};
        throw new Error(errorData.error || `Request failed with status ${response.status}`);
      }
  
      if (response.status === 204) {
        return null;
      }
  
      return await response.json();
    } catch (error) {
      console.error(`DELETE ${endpoint} error:`, error);
      throw error;
    }
  }
};