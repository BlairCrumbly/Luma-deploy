import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './components/contexts/AuthContext'; //authcontext
import AuthPage from './pages/AuthPage';
import HomePage from './pages/Homepage';
import OAuthRedirectHandler from './components/GoogleOauth/OauthHandler';
import './styles/global.css';
import ProtectedRoute from './components/ProtectedRoute';



function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<AuthPage />} />
          <Route path="/login/google" element={<OAuthRedirectHandler />} />
          
          {/* Protected routes */}
          <Route path="/" element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          } />
          
          <Route path="/home" element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          } />
          
          {/* Redirect all other routes to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;