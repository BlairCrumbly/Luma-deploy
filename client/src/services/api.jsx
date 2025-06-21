// Determine the base URL based on environment
const getBaseURL = () => {
  if (import.meta.env.PROD) {
    return import.meta.env.VITE_API_URL || '';
  }
  return '';
};

const BASE = getBaseURL();

// Helper function to get a cookie by name (for CSRF token)
const getCookie = (name) => {
  const cookies = document.cookie ? document.cookie.split('; ') : [];
  for (let cookie of cookies) {
    const [key, value] = cookie.split('=');
    if (key === name) return decodeURIComponent(value);
  }
  return null;
};

// Prepare headers for secure requests
const prepareHeaders = (method) => {
  const headers = {
    'Content-Type': 'application/json',
  };

  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method.toUpperCase())) {
    const csrfToken = getCookie('csrf_access_token');
    console.log('CSRF Token attached:', csrfToken); // <-- Debug line
    if (csrfToken) {
      headers['X-CSRF-TOKEN'] = csrfToken;
    }
  }

  return headers;
};

// Helper function to handle response errors
const handleResponse = async (response) => {
  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    let errorData;
    try {
      errorData = await response.json();
    } catch {
      errorData = { error: `Request failed with status ${response.status}` };
    }
    
    // Handle specific error cases
    if (response.status === 401) {
      // Token expired or invalid - redirect to login
      window.location.href = '/login';
      throw new Error(errorData.error || 'Authentication required');
    }
    
    if (response.status === 403) {
      throw new Error(errorData.error || 'Access forbidden');
    }
    
    throw new Error(errorData.error || `Request failed with status ${response.status}`);
  }

  // Handle no content responses
  if (response.status === 204) {
    return null;
  }

  try {
    return await response.json();
  } catch {
    return null;
  }
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

      return await handleResponse(response);
    } catch (error) {
      console.error(`GET ${endpoint} error:`, error);
      throw error;
    }
  },

  async post(endpoint, data = null) {
    try {
      const headers = prepareHeaders('POST');
      const response = await fetch(`${BASE}${endpoint}`, {
        method: 'POST',
        credentials: 'include',
        headers,
        ...(data && { body: JSON.stringify(data) }),
      });

      return await handleResponse(response);
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

      return await handleResponse(response);
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

      return await handleResponse(response);
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

      return await handleResponse(response);
    } catch (error) {
      console.error(`DELETE ${endpoint} error:`, error);
      throw error;
    }
  }
};