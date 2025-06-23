// client/src/utils/api.js

// Determine the base URL based on environment
const getBaseURL = () => {
  if (import.meta.envROD) {
    return import.meta.env.VITE_API_URL || '';
  }
  return '';
};

const BASE = getBaseURL();

// Get cookie value by name
export const getCookie = (name) => {
  const cookies = document.cookie.split(";");
  for (let cookie of cookies) {
    const [key, value] = cookie.trim().split("=");
    if (key === name) return decodeURIComponent(value);
  }
  return null;
};

// Get CSRF token only from existing cookies (never fetch after login)
const getCSRFToken = () => getCookie("csrf_access_token");


// Prepare headers for secure requests
const prepareHeaders = (method) => {
  const headers = {
    'Content-Type': 'application/json',
  };

  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method.toUpperCase())) {
    const csrfToken = getCSRFToken();
    if (csrfToken) {
      headers['X-CSRF-TOKEN'] = csrfToken;
      console.log('✅ CSRF token attached to request:', csrfToken);
    } else {
      console.warn('⚠️ No CSRF token found. User may not be logged in.');
    }
  }

  return headers;
};

// Handle responses with better error handling
const handleResponse = async (response) => {
  // Handle 404 as null (resource not found)
  if (response.status === 404) {
    return null;
  }

  // Handle non-OK responses
  if (!response.ok) {
    let errorData;
    try {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        errorData = await response.json();
      } else {
        errorData = { error: `Request failed with status ${response.status}` };
      }
    } catch {
      errorData = { error: `Request failed with status ${response.status}` };
    }

    // Handle authentication errors
    if (response.status === 401) {
      console.warn('🔒 Authentication required - redirecting to login');
      // Don't redirect immediately, let the calling code handle it
      throw new Error(errorData.error || 'Authentication required');
    }

    if (response.status === 403) {
      throw new Error(errorData.error || 'Access forbidden - CSRF token may be invalid');
    }

    throw new Error(errorData.error || `Request failed with status ${response.status}`);
  }

  // Handle empty responses
  if (response.status === 204) {
    return null;
  }

  // Parse JSON response
  try {
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      return await response.json();
    }
    return null;
  } catch {
    return null;
  }
};

// Clean retry logic (no CSRF retries after login)
const makeRequestWithRetry = async (url, options) => {
  try {
    const response = await fetch(url, options);
    return await handleResponse(response);
  } catch (error) {

    throw error;
  }
};

export const api = {
  async get(endpoint) {
    try {
      const headers = prepareHeaders('GET');
      const url = `${BASE}${endpoint}`;
      const options = {
        method: 'GET',
        credentials: 'include',
        headers
      };

      return await makeRequestWithRetry(url, options);
    } catch (error) {
      console.error(`GET ${endpoint} error:`, error);
      throw error;
    }
  },

  async post(endpoint, data = null) {
    try {
      const headers = prepareHeaders('POST');
      const url = `${BASE}${endpoint}`;
      const options = {
        method: 'POST',
        credentials: 'include',
        headers,
        ...(data && { body: JSON.stringify(data) }),
      };

      return await makeRequestWithRetry(url, options);
    } catch (error) {
      console.error(`POST ${endpoint} error:`, error);
      throw error;
    }
  },

  async put(endpoint, data) {
    try {
      const headers = prepareHeaders('PUT');
      const url = `${BASE}${endpoint}`;
      const options = {
        method: 'PUT',
        credentials: 'include',
        headers,
        body: JSON.stringify(data),
      };

      return await makeRequestWithRetry(url, options);
    } catch (error) {
      console.error(`PUT ${endpoint} error:`, error);
      throw error;
    }
  },

  async patch(endpoint, data) {
    try {
      const headers = prepareHeaders('PATCH');
      const url = `${BASE}${endpoint}`;
      const options = {
        method: 'PATCH',
        credentials: 'include',
        headers,
        body: JSON.stringify(data),
      };

      return await makeRequestWithRetry(url, options);
    } catch (error) {
      console.error(`PATCH ${endpoint} error:`, error);
      throw error;
    }
  },

  async delete(endpoint) {
    try {
      const headers = prepareHeaders('DELETE');
      const url = `${BASE}${endpoint}`;
      const options = {
        method: 'DELETE',
        credentials: 'include',
        headers,
      };

      return await makeRequestWithRetry(url, options);
    } catch (error) {
      console.error(`DELETE ${endpoint} error:`, error);
      throw error;
    }
  }
};

// Initialize CSRF token on app start
export const initializeCSRF = async () => {
  // Optional: only fetch if user is not authenticated
  const isLoggedIn = !!getCookie('access_token_cookie');
  if (isLoggedIn) {
    console.log('ℹ️ Already logged in, skipping CSRF init');
    return;
  }

  try {
    await fetch(`${BASE}/api/csrf-token`, {
      credentials: 'include'
    });
    console.log('✅ CSRF token initialized');
  } catch (error) {
    console.error('❌ Failed to initialize CSRF token:', error);
  }
};