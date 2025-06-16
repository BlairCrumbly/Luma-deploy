// API service wrapper for making HTTP requests
const BASE = import.meta.env.VITE_API_URL || '';

export const api = {
  // GET request
  async get(endpoint) {
    try {
      const csrfToken = document.cookie
        .split('; ')
        .find(row => row.startsWith('csrf_access_token'))
        ?.split('=')[1]; // Get CSRF token from cookie
      
      const response = await fetch(`${BASE}/api${endpoint}`, {
        method: 'GET',
        credentials: 'include', // Important for cookies/JWT
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': csrfToken || '', // Use the token if found, or empty string
        }
      });

      // For 404 errors with new users, return empty array instead of throwing
      if (response.status === 404) {
        console.log(`Endpoint ${endpoint} not found, returning empty array`);
        return [];
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
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
      const csrfToken = document.cookie
        .split('; ')
        .find(row => row.startsWith('csrf_access_token'))
        ?.split('=')[1];

      const response = await fetch(`${BASE}/api${endpoint}`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': csrfToken || '',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Request failed with status ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`POST ${endpoint} error:`, error);
      throw error;
    }
  },

  async put(endpoint, data) {
    try {
      const csrfToken = document.cookie
        .split('; ')
        .find(row => row.startsWith('csrf_access_token'))
        ?.split('=')[1]; // Get CSRF token from cookie
  
      const response = await fetch(`${BASE}/api${endpoint}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': csrfToken || '', // Use the token if found, or empty string
        },
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
      const csrfToken = document.cookie
        .split('; ')
        .find(row => row.startsWith('csrf_access_token'))
        ?.split('=')[1]; // Get CSRF token from cookie

      const response = await fetch(`${BASE}/api${endpoint}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': csrfToken || '', // Use the token if found, or empty string
        },
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
      const csrfToken = document.cookie
        .split('; ')
        .find(row => row.startsWith('csrf_access_token'))
        ?.split('=')[1]; // Get CSRF token from cookie
  
      const options = {
        method: 'DELETE',
        credentials: 'include', // Ensure cookies are sent with the request
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': csrfToken || '', // Use the token if found, or empty string
        },
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
}