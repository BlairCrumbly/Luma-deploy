import React, { useState, useEffect } from 'react';
import AuthForm from '../components/Auth/AuthForm';
import GoogleOAuthButton from '../components/GoogleOauth/GoogleOAuthButton';
import './AuthPage.css';

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  useEffect(() => {
    document.body.classList.add('auth-page-active');
    return () => {
      document.body.classList.remove('auth-page-active');
    };
  }, []);
  
 

  
  const toggleMode = () => {
    setIsLogin(!isLogin);
  };
  
  return (
    <div className="auth-page">
      <div className="image-container">
        {/* Full page image on the left */}
        <img 
          src="../../images/kimia-kazemi-i3tXuyobvQs-unsplash.jpg" 
          alt="Login visual" 
        />
      </div>
      
      <div className="form-container">
      <div className="luma-container">
      <h1>Luma
      </h1>
      </div>
        <h1 className="auth-title">{isLogin ? 'Welcome Back' : 'Create Account'}</h1>
        <AuthForm isLogin={isLogin} />
        
        <div className="divider">
          <span>OR</span>
        </div>
        
        <GoogleOAuthButton className="google-oauth-button" />
        
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