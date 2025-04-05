// GoogleOAuthButton.js
import React from 'react';

const GoogleOAuthButton = () => {
  const handleGoogleLogin = () => {
    // Adjust the URL and port as needed for your backend
    window.location.href = '/login/google';
  };

  return (
    <button onClick={handleGoogleLogin}>
      Continue with Google
    </button>
  );
};

export default GoogleOAuthButton;
