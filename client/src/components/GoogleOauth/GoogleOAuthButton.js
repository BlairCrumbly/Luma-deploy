import React from 'react';

const GoogleLoginButton = () => {
    const handleGoogleLogin = () => {
        window.location.href = '/api/login/google';  //! This redirects to the Google OAuth route in Flask
    };

    return (
        <button onClick={handleGoogleLogin}>
            Sign up with Google
        </button>
    );
};

export default GoogleLoginButton;
