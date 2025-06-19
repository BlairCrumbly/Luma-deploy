const BASE = import.meta.env.VITE_API_URL || '';

// Helper function to get a cookie by name (for CSRF token)
const getCookie = (name) => {
  const cookies = document.cookie.split(';');
  for (let cookie of cookies) {
    const [key, value] = cookie.trim().split('=');
    if (key === name) return decodeURIComponent(value);
  }
  return null;
};

// Prepare headers for secure requests
const prepareHeaders = (method) => {
  const headers = {
    'Content-Type': 'application/json',
  };

  // Only attach CSRF token for methods that modify data
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method.toUpperCase())) {
    const csrfToken = getCookie('csrf_access_token');
    if (csrfToken) headers['X-CSRF-TOKEN'] = csrfToken;
  }

  return headers;
};

export const api = {
  async get(endpoint) {
    try {
      const headers = prepareHeaders('GET');
      const response = await fetch(`${BASE}${endpoint}`, {
        method: 'GET',
        credentials: 'include',
        headers
      });

      if (response.status === 404) return [];

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

  async post(endpoint, data) {
    try {
      const headers = prepareHeaders('POST');
      const response = await fetch(`${BASE}${endpoint}`, {
        method: 'POST',
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
      console.error(`POST ${endpoint} error:`, error);
      throw error;
    }
  },

  async put(endpoint, data) {
    try {
      const headers = prepareHeaders('PUT');
      const response = await fetch(`${BASE}${endpoint}`, {
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
      const headers = prepareHeaders('PATCH');
      const response = await fetch(`${BASE}${endpoint}`, {
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
      const headers = prepareHeaders('DELETE');
      const response = await fetch(`${BASE}${endpoint}`, {
        method: 'DELETE',
        credentials: 'include',
        headers,
      });

      if (!response.ok) {
        if (response.status === 404) return null;
        const errorText = await response.text();
        const errorData = errorText ? JSON.parse(errorText) : {};
        throw new Error(errorData.error || `Request failed with status ${response.status}`);
      }

      if (response.status === 204) return null;

      return await response.json();
    } catch (error) {
      console.error(`DELETE ${endpoint} error:`, error);
      throw error;
    }
  }
};