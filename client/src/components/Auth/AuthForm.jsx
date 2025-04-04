// toggle login/signup
// /src/components/Auth/AuthForm.js
import React, { useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import GoogleOAuthButton from "../GoogleOauth/GoogleOAuthButton";
import "./AuthForm.css";

const AuthForm = ({ isLogin }) => {
  const [error, setError] = useState("");

  // Define validation schema
  const validationSchema = Yup.object({
    email: !isLogin
      ? Yup.string().email("Invalid email").required("Email is required")
      : Yup.string(), // not used for login
    username: Yup.string().required("Username is required"),
    password: Yup.string().required("Password is required"),
  });

  const formik = useFormik({
    initialValues: {
      email: "",
      username: "",
      password: "",
    },
    validationSchema: validationSchema,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        const endpoint = isLogin ? "/api/login" : "/api/signup";
        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include", // to send cookies
          body: JSON.stringify(values),
        });
        const data = await response.json();

        if (!response.ok) {
          setError(data.error || "An error occurred");
        } else {
          // Successful login/signup
          // Redirect to dashboard, or update your auth context, etc.
          window.location.href = "/dashboard"; // For example
        }
      } catch (err) {
        setError("An error occurred. Please try again.");
      }
      setSubmitting(false);
    },
  });

  return (
    <form onSubmit={formik.handleSubmit} className="auth-form">
      {!isLogin && (
        <div className="form-group">
          <input
            type="email"
            name="email"
            placeholder="Email"
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            value={formik.values.email}
          />
          {formik.touched.email && formik.errors.email && (
            <div className="error">{formik.errors.email}</div>
          )}
        </div>
      )}

      <div className="form-group">
        <input
          type="text"
          name="username"
          placeholder="Username"
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          value={formik.values.username}
        />
        {formik.touched.username && formik.errors.username && (
          <div className="error">{formik.errors.username}</div>
        )}
      </div>

      <div className="form-group">
        <input
          type="password"
          name="password"
          placeholder="Password"
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          value={formik.values.password}
        />
        {formik.touched.password && formik.errors.password && (
          <div className="error">{formik.errors.password}</div>
        )}
      </div>

      {error && <div className="error-message">{error}</div>}

      <button type="submit" className="submit-btn">
        {isLogin ? "Log In" : "Sign Up"}
      </button>

      <GoogleOAuthButton />
    </form>
  );
};

export default AuthForm;
