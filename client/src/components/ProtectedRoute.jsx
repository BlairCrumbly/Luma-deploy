import { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from "../components/contexts/AuthContext";

export default function ProtectedRoute({ children }) {
  const { user } = useContext(AuthContext);

  if (!user) {
    // Redirect to login if the user is not authenticated
    return <Navigate to="/login" />;
  }

  // Allow access to the children (protected routes) if the user is authenticated
  return children;
}