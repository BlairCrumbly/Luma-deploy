import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./components/Login/Login";
import HomePage from "./pages/HomePage";
import Dashboard from "./components/Dashboard/Dashboard";
import JournalPage from "./pages/JournalPage";
import EntryPage from "./pages/EntryPage";
import CreateJournalPage from "./pages/CreateJournalPage";
import CreateEntryPage from "./pages/CreateEntryPage";
import "./styles/global.css";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/journals/:id" element={<JournalPage />} />
        <Route path="/entries/:id" element={<EntryPage />} />
        <Route path="/create-journal" element={<CreateJournalPage />} />
        <Route path="/create-entry" element={<CreateEntryPage />} />
      </Routes>
    </Router>
  );
}

export default App;
