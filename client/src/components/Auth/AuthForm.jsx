// client/src/components/Auth/AuthForm.jsx
import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import './AuthForm.css';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';

const AuthForm = ({ isLogin }) => {
  const { login, signup } = useContext(AuthContext);
  const navigate = useNavigate();


  const initialValues = isLogin 
    ? { username: '', password: '' }
    : { username: '', email: '', password: '' };

  const validationSchema = isLogin 
    ? Yup.object({
        username: Yup.string().required('Username is required'),
        password: Yup.string().required('Password is required'),
      })
    : Yup.object({
        username: Yup.string().required('Username is required'),
        email: Yup.string()
          .email('Invalid email address')
          .required('Email is required'),
        password: Yup.string()
          .min(6, 'Password must be at least 6 characters')
          .required('Password is required'),
      });


  const handleSubmit = async (values, { setSubmitting, setFieldError }) => {
    try {
      if (isLogin) {
        await login(values.username, values.password);
      } else {
        await signup(values.username, values.email, values.password);
      }
      navigate('/');
    } catch (err) {
      setFieldError('general', err.message || 'Authentication failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={handleSubmit}
    >
      {({ isSubmitting, errors }) => (
        <Form className="auth-form">
          {errors.general && (
            <div className="error-message">{errors.general}</div>
          )}

          <div className="form-group">
            <label htmlFor="username">Username</label>
            <Field type="text" id="username" name="username" />
            <ErrorMessage name="username" component="div" className="error-message" />
          </div>

          {!isLogin && (
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <Field type="email" id="email" name="email" />
              <ErrorMessage name="email" component="div" className="error-message" />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <Field type="password" id="password" name="password" />
            <ErrorMessage name="password" component="div" className="error-message" />
          </div>

          <button type="submit" className="submit-button" disabled={isSubmitting}>
            {isSubmitting ? 'Processing...' : isLogin ? 'Log In' : 'Sign Up'}
          </button>
        </Form>
      )}
    </Formik>
  );
};

export default AuthForm;