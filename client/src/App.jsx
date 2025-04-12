import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './components/contexts/AuthContext';
import AuthPage from './pages/AuthPage';
import HomePage from './pages/Homepage';
import OAuthRedirectHandler from './components/GoogleOauth/OauthHandler';
import './styles/global.css';
import ProtectedRoute from './components/ProtectedRoute';
import EntriesPage from './pages/EntryPage';
import JournalPage from './pages/JournalPage';
import JournalFormPage from './pages/JournalFormPage';
import Navbar from './components/Navbar/Navbar'
import EntriesList from './components/Entries/EntriesList';
import EntryForm from './components/EntryForm/EntryForm';
import EntryEditor from './components/EntryEditor/EntryEditor';
import { Toaster } from 'react-hot-toast';







function App() {
  return (
    <AuthProvider>
      <Router>
      <Toaster position="top-right" />
        <Navbar /> {/* Include the Navbar component */}
        <div className="main-content">
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
            <Route path="/entries" element={
              <ProtectedRoute>
                <EntriesPage />
              </ProtectedRoute>
            } />
            <Route path="/journals" element={
              <ProtectedRoute>
                <JournalPage />
              </ProtectedRoute>
            } />
            <Route path="/journals/new" element={
              <ProtectedRoute>
                <JournalFormPage />  {/* This route will show the journal form */}
              </ProtectedRoute>
            } />
              <Route path="/journal/:journalId/entries" element={
              <ProtectedRoute>
                <EntriesList />
              </ProtectedRoute>
            } />
            
            {/* New entry form route */}
            <Route path="/journal/new-entry" element={
              <ProtectedRoute>
                <EntryForm />
              </ProtectedRoute>
            } />

            {/* Entry editor route */}
            <Route path="/entry/:entryId" element={
              <ProtectedRoute>
                <EntryEditor />
              </ProtectedRoute>
            } />

            {/* Redirect all other routes to home */}
            <Route path="*" element={<Navigate to="/" replace />} />

          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;