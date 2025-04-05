// AuthPage.jsx
import { useState } from 'react';
import { useFormik } from "formik";
import * as Yup from "yup";
import { useNavigate } from "react-router-dom";
import { login, signup } from "../services/api";
import AuthForm from '../components/Auth/AuthForm';
import GoogleOAuthButton from '../components/GoogleOauth/GoogleOAuthButton';
import './AuthPage.css';
import { useContext } from 'react';
import { AuthContext } from '../components/contexts/AuthContext';
import Dashboard from '../components/Dashboard/Dashboard';
 

export default function AuthPage() {
  const { login: loginContext } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isSignup, setIsSignup] = useState(false);
  const [message, setMessage] = useState("");

  const validationSchema = Yup.object({
    username: Yup.string().required("Username is required"),
    email: isSignup ? Yup.string().email("Invalid email").required("Email is required") : Yup.string(),
    password: Yup.string().min(6, "Password must be at least 6 characters").required("Password is required"),
  });

  const formik = useFormik({
    initialValues: { username: "", email: "", password: "" },
    validationSchema,
    onSubmit: async (values) => {
      try {
        const data = isSignup ? await signup(values) : await login(values);

        if (data.id) {
          loginContext(data);
          navigate("/dashboard");
        } else {
          setMessage(data.message || "Something went wrong");
        }
      } catch (error) {
        setMessage("Error connecting to server");
      }
    },
  });

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>Taskr</h1>
        <h2>{isSignup ? "Sign up" : "Login"}</h2>
        <AuthForm isLogin={!isSignup} />
        <p>OR</p>
        <GoogleOAuthButton />
        <p>
          {isSignup ? "Already have an account? " : "Don't have an account? "}
          <button className="toggle-btn" onClick={() => setIsSignup(!isSignup)}>
            {isSignup ? "Login here" : "Signup here"}
          </button>
        </p>
        {message && <p className="message-text">{message}</p>}
      </div>
    </div>
  );
}