import React, { useEffect, useContext } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const OAuthRedirectHandler = () => {
  const navigate = useNavigate();
  const { setUser } = useContext(AuthContext);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        const error = searchParams.get('error');
        
        if (error) {
          console.error('OAuth error:', error);
          toast.error('Authentication failed. Please try again.');
          navigate('/login');
          return;
        }

        // Check if we have authentication cookies by trying to fetch profile
        const response = await fetch('/api/user/profile', {
          method: 'GET',
          credentials: 'include',
        });

        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
          toast.success('Successfully logged in!');
          navigate('/');
        } else {
          throw new Error('Failed to authenticate');
        }
      } catch (error) {
        console.error('OAuth handling error:', error);
        toast.error('Authentication failed. Please try again.');
        navigate('/login');
      }
    };

    handleOAuthCallback();
  }, [navigate, setUser, searchParams]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-lg">Completing authentication...</p>
      </div>
    </div>
  );
};

export default OAuthRedirectHandler;