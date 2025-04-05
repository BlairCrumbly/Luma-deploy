// src/App.jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './components/contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AuthPage from './pages/AuthPage';
import Homepage from './pages/Homepage';
import Dashboard from './components/Dashboard/Dashboard';
// import JournalPage from './pages/JournalPage';
// import EntryPage from './pages/EntryPage';
// import CreateJournalPage from './pages/CreateJournalPage';
// import CreateEntryPage from './pages/CreateEntryPage';
// import Navbar from './components/Navbar/Navbar';
import './styles/global.css';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        {/* <Navbar /> */}
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<AuthPage isLogin={true} />} />
          <Route path="/signup" element={<AuthPage isLogin={false} />} />

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Homepage />} />
            <Route path="/dashboard" element={<Dashboard />} />
            {/* <Route path="/journals" element={<JournalPage />} />
            <Route path="/journals/create" element={<CreateJournalPage />} />
            <Route path="/entries" element={<EntryPage />} />
            <Route path="/entries/create" element={<CreateEntryPage />} /> */}
          </Route>

          {/* Catch-all Route */}
          <Route path="*" element={<h1>404 Not Found</h1>} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;