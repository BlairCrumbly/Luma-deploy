// import React, { createContext, useState, useEffect, useContext } from "react";
// import { useHistory } from "react-router-dom";

// const AuthContext = createContext();

// export const useAuth = () => useContext(AuthContext);

// export const AuthProvider = ({ children }) => {
//   const [user, setUser] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const history = useHistory();

//   useEffect(() => {
//     const fetchProfile = async () => {
//       try {
//         const res = await fetch("/api/user/profile", {
//           method: "GET",
//           credentials: "include", // Send cookies
//         });

//         if (res.ok) {
//           const data = await res.json();
//           setUser(data);
//         } else {
//           setUser(null);
//         }
//       } catch (err) {
//         console.error("Failed to fetch profile:", err);
//         setUser(null);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchProfile();
//   }, []);

//   const login = async (credentials) => {
//     try {
//       const csrfRes = await fetch("/api/csrf-token", {
//         credentials: "include",
//       });

//       const res = await fetch("/api/login", {
//         method: "POST",
//         credentials: "include",
//         headers: {
//           "Content-Type": "application/json",
//           "X-CSRF-Token": getCSRFTokenFromCookie(), // see helper below
//         },
//         body: JSON.stringify(credentials),
//       });

//       if (res.ok) {
//         const data = await res.json();
//         setUser(data);
//         history.push("/dashboard");
//       } else {
//         const error = await res.json();
//         throw new Error(error.error || "Login failed");
//       }
//     } catch (err) {
//       console.error("Login error:", err);
//     }
//   };

//   const logout = async () => {
//     try {
//       const res = await fetch("/api/logout", {
//         method: "DELETE",
//         credentials: "include",
//         headers: {
//           "X-CSRF-Token": getCSRFTokenFromCookie(),
//         },
//       });

//       if (res.ok) {
//         setUser(null);
//         history.push("/login");
//       } else {
//         console.error("Logout failed");
//       }
//     } catch (err) {
//       console.error("Logout error:", err);
//     }
//   };

//   const value = {
//     currentUser: user,
//     loading,
//     login,
//     logout,
//   };

//   return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
// };

// // Helper to get CSRF token from cookies
// function getCSRFTokenFromCookie() {
//   const match = document.cookie.match(/csrf_access_token=([^;]+)/);
//   return match ? decodeURIComponent(match[1]) : "";
// }
