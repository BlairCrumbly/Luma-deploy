// /src/services/api.js
// With Vite proxy configured, use relative paths for API requests

export const loginUser = async (username, password) => {
    const response = await fetch("/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include", // to include cookies
      body: JSON.stringify({ username, password }),
    });
    return response.json();
  };
  
  export const signupUser = async (email, username, password) => {
    const response = await fetch("/api/signup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ email, username, password }),
    });
    return response.json();
  };
  
  // Other API functions as needed...
  