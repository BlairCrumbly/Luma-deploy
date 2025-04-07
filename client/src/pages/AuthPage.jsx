import React, { useState } from 'react';
import AuthForm from '../components/Auth/AuthForm';
import GoogleOAuthButton from '../components/GoogleOauth/GoogleOAuthButton';
import './AuthPage.css';

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);

  const toggleMode = () => {
    setIsLogin(!isLogin);
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <h1 className="auth-title">{isLogin ? 'Welcome Back' : 'Create Account'}</h1>
        <AuthForm isLogin={isLogin} />
        
        <div className="divider">
          <span>OR</span>
        </div>
        
        <GoogleOAuthButton />
        
        <p className="toggle-mode">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button onClick={toggleMode} className="link-button">
            {isLogin ? 'Sign Up' : 'Log In'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default AuthPage;