// /src/components/GoogleOAuth/GoogleOAuthButton.js
import React from "react";
import "./GoogleOAuthButton.css";

const GoogleOAuthButton = () => {
  const handleGoogleLogin = () => {
    // Redirect to your backend's Google login route (using proxy)
    window.location.href = "/api/login/google";
  };

  return (
    <button onClick={handleGoogleLogin} className="google-oauth-btn">
      Sign up with Google
    </button>
  );
};

export default GoogleOAuthButton;
