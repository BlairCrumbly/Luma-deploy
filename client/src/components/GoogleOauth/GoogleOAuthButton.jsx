// /src/components/GoogleOAuth/GoogleOAuthButton.js
import React from "react";
import "./GoogleOAuthButton.css";


function GoogleOAuthButton() {
  const handleGoogleLogin = () => {
    // Here, you would typically initiate OAuth login via Google
    console.log("Google OAuth Login");
  };

  return (
    <button onClick={handleGoogleLogin} className="google-oauth-btn">
      Sign In with Google
    </button>
  );
}

export default GoogleOAuthButton;
