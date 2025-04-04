//Shows AuthForm with toggle
// /src/pages/AuthPage.js
import React, { useState } from "react";
import AuthForm from "../components/Auth/AuthForm";
import GoogleOAuthButton from '../components/GoogleOauth/GoogleOAuthButton';
import "../pages/AuthPage.css";
import { useNavigate } from "react-router-dom";
 // To navigate after successful login/signup

function AuthPage() {
  const [isSignup, setIsSignup] = useState(true); // Track if the form is for signup or login
  const [formData, setFormData] = useState({
    email: "",
    username: "",
    password: ""
  });

  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    // Call API to handle signup or login here
    if (isSignup) {
      console.log("Signing up with", formData);
      // For now, mock success and navigate to homepage
      navigate("/");
    } else {
      console.log("Logging in with", formData);
      // For now, mock success and navigate to homepage
      navigate("/");
    }
  };

  const toggleForm = () => {
    setIsSignup((prev) => !prev); // Toggle between signup and login
  };

  return (
    <div className="auth-page">
      <div className="auth-form-container">
        <h1>{isSignup ? "Sign Up" : "Log In"}</h1>

        <form onSubmit={handleFormSubmit}>
          <div>
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleInputChange}
              required
            />
          </div>

          {isSignup && (
            <div>
              <input
                type="text"
                name="username"
                placeholder="Username"
                value={formData.username}
                onChange={handleInputChange}
                required
              />
            </div>
          )}

          <div>
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleInputChange}
              required
            />
          </div>

          <button type="submit">{isSignup ? "Sign Up" : "Log In"}</button>
        </form>

        <div className="toggle">
          <span onClick={toggleForm}>
            {isSignup ? "Already have an account? Log In" : "Don't have an account? Sign Up"}
          </span>
        </div>

        <GoogleOAuthButton /> {/* Google OAuth Button */}
      </div>
    </div>
  );
}

export default AuthPage;
