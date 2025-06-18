// API service wrapper for making HTTP requests
const BASE = import.meta.env.VITE_API_URL || '';

// Utility function to get a cookie by name (needed for CSRF token)
function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
}

// Helper function to get JWT token from localStorage or sessionStorage
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

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${BASE}/api${endpoint}`, {
        method: 'GET',
        credentials: 'include',
        headers,
      });

      console.log(`Response status: ${response.status}`);

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

  // POST request (with CSRF token header)
  async post(endpoint, data) {
    try {
      const token = getAuthToken();
      console.log(`Making POST request to: ${BASE}/api${endpoint}`);
      console.log(`Token exists: ${!!token}`);
      console.log(`Request data:`, data);

      const headers = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Add CSRF token header from cookie (required by Flask-JWT-Extended)
      const csrfToken = getCookie('csrf_access_token');
      if (csrfToken) {
        headers['X-CSRF-TOKEN'] = csrfToken;
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
          return null;
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
