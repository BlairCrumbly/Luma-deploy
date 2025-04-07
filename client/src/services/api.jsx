// API service wrapper for making HTTP requests

export const api = {
  // GET request
  async get(endpoint) {
    try {
      const response = await fetch(`/api${endpoint}`, {
        method: 'GET',
        credentials: 'include', // Important for cookies/JWT
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Network response was not ok');
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
      const response = await fetch(`/api${endpoint}`, {
        method: 'POST',
        credentials: 'include', // Important for cookies/JWT
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Network response was not ok');
      }

      return await response.json();
    } catch (error) {
      console.error(`POST ${endpoint} error:`, error);
      throw error;
    }
  },

  // DELETE request
  async delete(endpoint, data = null) {
    try {
      const options = {
        method: 'DELETE',
        credentials: 'include', // Important for cookies/JWT
        headers: {
          'Content-Type': 'application/json'
        }
      };

      if (data) {
        options.body = JSON.stringify(data);
      }

      const response = await fetch(`/api${endpoint}`, options);

      if (!response.ok) {
        // Try to parse error as JSON, but handle cases where response might be empty
        if (response.status !== 204) { // 204 No Content is a valid response for DELETE
          const errorText = await response.text();
          const errorData = errorText ? JSON.parse(errorText) : {};
          throw new Error(errorData.error || 'Network response was not ok');
        }
      }

      // Handle 204 No Content which is often returned for successful DELETE operations
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
