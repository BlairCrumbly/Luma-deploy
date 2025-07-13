// client/src/services/api.js

// Determine the base URL based on environment
const getBaseURL = () => {
  if (import.meta.env.PROD) {
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

// Get CSRF token from cookies
const getCSRFToken = () => {
  // Try different possible CSRF cookie names
  return getCookie("csrf_access_token") || getCookie("csrf_token_client");
};

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
      console.warn('⚠️ No CSRF token found. This may cause 403 errors.');
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
      console.warn('🔒 Authentication required');
      throw new Error(errorData.error || 'Authentication required');
    }

    // Handle CSRF errors
    if (response.status === 403) {
      console.error('🚫 CSRF token error - may need to refresh');
      throw new Error(errorData.error || 'CSRF token invalid or missing');
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

// Make request with retry logic for CSRF errors
const makeRequestWithRetry = async (url, options) => {
  try {
    const response = await fetch(url, options);
    return await handleResponse(response);
  } catch (error) {
    // If CSRF error and this is not already a CSRF token request, try to refresh CSRF token
    if (error.message.includes('CSRF') && !url.includes('/csrf-token')) {
      console.log('🔄 Attempting to refresh CSRF token...');
      try {
        await initializeCSRF();
        // Retry the original request with new CSRF token
        const newHeaders = prepareHeaders(options.method);
        const retryOptions = { ...options, headers: newHeaders };
        const retryResponse = await fetch(url, retryOptions);
        return await handleResponse(retryResponse);
      } catch (retryError) {
        console.error('❌ CSRF refresh failed:', retryError);
        throw error; // Throw original error
      }
    }
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
  try {
    const response = await fetch(`${BASE}/api/csrf-token`, {
      credentials: 'include',
      method: 'GET'
    });
    
    if (response.ok) {
      console.log('✅ CSRF token initialized');
    } else {
      console.error('❌ Failed to initialize CSRF token:', response.status);
    }
  } catch (error) {
    console.error('❌ Failed to initialize CSRF token:', error);
  }
};