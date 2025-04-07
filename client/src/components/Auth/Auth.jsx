// Helper functions for auth-related operations

// Function to check if a user is authenticated
export const isAuthenticated = () => {
    // In a real implementation, you might check for token expiration
    // For now, we'll just check if we have a user in the AuthContext
    return true; // This will be replaced with actual logic from AuthContext
  };
  
  // Function to handle Google OAuth redirect
  export const handleOAuthRedirect = async (navigate, handleGoogleRedirect) => {
    try {
      // Get URL parameters
      const urlParams = new URLSearchParams(window.location.search);
      
      // Check for any error parameters
      const error = urlParams.get('error');
      if (error) {
        console.error('OAuth error:', error);
        navigate('/login');
        return false;
      }
      
      // If OAuth flow was successful, the backend should have set cookies already
      await handleGoogleRedirect();
      navigate('/');
      return true;
    } catch (error) {
      console.error('Failed to process OAuth redirect:', error);
      navigate('/login');
      return false;
    }
  };
  
  // Function to format user display name (for use in UI)
  export const formatUserName = (user) => {
    if (!user) return '';
    return user.username || user.email.split('@')[0];
  };