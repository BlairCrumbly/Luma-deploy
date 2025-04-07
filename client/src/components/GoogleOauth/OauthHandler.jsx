import React, { useEffect, useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';


const OAuthRedirectHandler = () => {
  const auth = useContext(AuthContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleRedirect = async () => {
      try {
        console.log("Starting OAuth redirect handling...");
        
        // Debug the auth object to see what's available
        console.log("Auth context:", auth);
        
        // Use handleGoogleRedirect which is defined in the AuthContext
        const userData = await auth.handleGoogleRedirect();
        console.log("User data received:", userData);
        
        if (userData) {
          // Authentication successful, redirect to home
          navigate('/home', { replace: true });
        } else {
          throw new Error('No user data returned after authentication');
        }
      } catch (err) {
        console.error('OAuth error:', err);
        setError(err.message || 'Authentication failed');
        setTimeout(() => {
          navigate('/login', { replace: true });
        }, 3000);
      } finally {
        setLoading(false);
      }
    };

    handleRedirect();
  }, [auth, navigate]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent border-blue-600 align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
          <p className="mt-4">Completing authentication...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Authentication failed!</strong>
          <p className="block sm:inline">{error}</p>
          <p className="mt-2">Redirecting to login page...</p>
        </div>
      </div>
    );
  }

  return null;
};

export default OAuthRedirectHandler;