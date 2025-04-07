import { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from "../components/contexts/AuthContext";

const ProtectedRoute = ({ children }) => {
  const { currentUser, loading } = useContext(AuthContext);

  if (loading) {
    return <div>Loading...</div>;  // Show loading state while checking auth
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  return children;
};


export default ProtectedRoute;