import { createContext, useContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Retrieve the value from localStorage
    const storedUser = localStorage.getItem("user");

    // Check if storedUser exists and is not "undefined" or an empty string
    if (storedUser && storedUser !== "undefined" && storedUser.trim() !== "") {
      try {
        const parsedUser = JSON.parse(storedUser);
        // Optionally, check if parsedUser is an object with keys
        if (parsedUser && typeof parsedUser === 'object' && Object.keys(parsedUser).length > 0) {
          setUser(parsedUser);
        } else {
          setUser(null);
        }
      } catch (e) {
        console.error('Error parsing user data from localStorage:', e);
        setUser(null);
      }
    } else {
      // If nothing valid is found in localStorage, try fetching from backend
      fetch("/profile", {
        credentials: "include",
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data) {
            setUser(data);
            localStorage.setItem("user", JSON.stringify(data));
          }
        })
        .catch(() => setUser(null));
    }
  }, []);

  const login = (userData) => {
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
    console.log("User logged in:", userData); // Check if user data is correct
  };

  const logout = () => {
    fetch("/logout", {
      method: "DELETE",
      credentials: "include",
    })
      .then(() => {
        setUser(null);
        localStorage.removeItem("user");
      })
      .catch(() => setUser(null));
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
export default AuthProvider;
