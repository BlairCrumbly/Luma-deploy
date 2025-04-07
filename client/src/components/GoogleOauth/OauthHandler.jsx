import React, { useEffect, useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { handleOAuthRedirect } from '../Auth/Auth';

const OAuthRedirectHandler = () => {
  const { handleGoogleRedirect } = useContext(AuthContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const processRedirect = async () => {
      try {
        // Get URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        
        // Check for any error parameters
        const error = urlParams.get('error');
        if (error) {
          throw new Error(`OAuth error: ${error}`);
        }
        
        // Verify the state parameter
        const returnedState = urlParams.get('state');
        const storedState = localStorage.getItem('oauth_state');
        
        if (!returnedState || returnedState !== storedState) {
          throw new Error('State verification failed. Please try again.');
        }
        
        // Clean up the stored state
        localStorage.removeItem('oauth_state');
        
        // Complete the authentication process
        await handleGoogleRedirect();
        navigate('/');
      } catch (err) {
        console.error('OAuth error:', err);
        setError(err.message || 'Failed to authenticate');
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } finally {
        setLoading(false);
      }
    };

    processRedirect();
  }, [navigate, handleGoogleRedirect]);

  if (loading) {
    return (
      <div className="oauth-redirect-handler">
        <div className="loading-spinner"></div>
        <p>Completing authentication...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="oauth-redirect-handler error">
        <p>Authentication failed: {error}</p>
        <p>Redirecting to login page...</p>
      </div>
    );
  }

  return null; // Won't be rendered as we navigate away on success
};

export default OAuthRedirectHandler;