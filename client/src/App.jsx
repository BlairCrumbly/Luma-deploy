import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// Import pages
import AuthPage from "./pages/AuthPage";
import HomePage from "./pages/Homepage";

// Import the GoogleOAuthButton component
import GoogleOAuthButton from "./components/GoogleOauth/GoogleOAuthButton";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<AuthPage />} />
        <Route path="/" element={<HomePage />} />
        {/* Add other routes ofc */}
      </Routes>
    </Router>
  );
}

export default App;
