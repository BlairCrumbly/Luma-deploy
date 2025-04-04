//Shows AuthForm with toggle
// /src/pages/AuthPage.js
import React, { useState } from "react";
import AuthForm from "../components/Auth/AuthForm.jsx";
import "../pages/AuthPage.css";

const AuthPage = () => {
  // isLogin determines whether to show login or signup form
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="auth-page">
      <div className="auth-left">
        <header className="auth-header">
          <h1 className="project-name">Luma</h1>
          <h2 className="welcome-text">Welcome</h2>
        </header>
        <AuthForm isLogin={isLogin} />
        <div className="toggle-section">
          {isLogin ? (
            <p>
              Don't have an account?{" "}
              <button onClick={() => setIsLogin(false)} className="toggle-btn">
                Sign Up
              </button>
            </p>
          ) : (
            <p>
              Already have an account?{" "}
              <button onClick={() => setIsLogin(true)} className="toggle-btn">
                Log In
              </button>
            </p>
          )}
        </div>
      </div>
      <div className="auth-right">
        {/* Right side reserved for an image */}
      </div>
    </div>
  );
};

export default AuthPage;
