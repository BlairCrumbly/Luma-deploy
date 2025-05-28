import { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from "../components/contexts/AuthContext";

const ProtectedRoute = ({ children }) => {
  const context = useContext(AuthContext);

  if (!context) {
    console.error("AuthContext is undefined. Are you missing the AuthProvider?");
    return <Navigate to="/api/login" replace />;
  }

  const { currentUser, loading } = context;

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;