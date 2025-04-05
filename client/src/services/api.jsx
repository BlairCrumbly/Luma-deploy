
//api.js



async function fetchWithCSRF(url, options = {}) {
  // Remove the 'Content-Type' header for GET requests since they don't need a request body
  const headers = options.method === "GET"
    ? { ...options.headers }  // Don't include Content-Type for GET requests
    : {
        "Content-Type": "application/json",
        "X-CSRF-TOKEN": getCSRFToken(),
        ...(options.headers || {}),
      };

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: "include",  //! ensure cookies are sent
  });

  if (response.status === 401) {
    alert("Your session has expired. Please log in again.");
    window.location.href = "/login";
    return;
  }

  return response.json();
}




function getCSRFToken() {
  return document.cookie
    .split("; ")
    .find(row => row.startsWith("csrf_token="))
    ?.split("=")[1] || "";
}

export async function login(values) {
  return fetchWithCSRF(`/login`, {
    method: "POST",
    body: JSON.stringify(values),
  });
}

export async function signup(values) {
  return fetchWithCSRF(`/signup`, {
    method: "POST",
    body: JSON.stringify(values),
  });
}

export async function logout() {
  return fetchWithCSRF(`/logout`, { method: "DELETE" });
}

export async function getClasses() {
  try {
    const response = await fetchWithCSRF(`/classes`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-TOKEN": getCSRFToken(),
      },
      credentials: "include",
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Error ${response.status}: ${errorData.message || "Unknown error"}`);
    }

    const data = await response.json();
    if (!Array.isArray(data)) {
      throw new Error("Invalid data format: Expected an array");
    }

    return data;
  } catch (error) {
    console.error("Error fetching classes:", error);
    throw error;
  }
}


export async function createClass(values) {
    return fetchWithCSRF(`/classes`, {
        method: "POST",
        body: JSON.stringify(values),
    });
}

export async function deleteClass(klassId) {
    return fetchWithCSRF(`/classes/${klassId}`, {
        method: "DELETE",
    });
}

