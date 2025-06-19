import React, { useState } from 'react';
import JournalForm from '../components/JournalForm/JournalForm';
import JournalsList from '../components/Journals/JournalsList'; 
import { api } from '../services/api';
import '../styles/JournalsPage.css';
import { useNavigate } from 'react-router-dom';

//! reflag is forcing journal list to re fetch (refresh) its data !
const JournalPage = () => {
  const [refreshFlag, setRefreshFlag] = useState(false);

  const navigate = useNavigate();

  const handleJournalUpdate = () => {
    setRefreshFlag(!refreshFlag);
  };
  
  return (
    <div className="journal-page">
      <div className="journals-header">
        <h1>My Journals</h1>
        {/* window location tells browser to go to the certain url */}
        <button className="new-journal-btn" onClick={() => navigate('/api/journals/new')}>
          New Journal
        </button>
      </div>
      <JournalsList refreshFlag={refreshFlag} onJournalUpdate={handleJournalUpdate} />
    </div>
  );
};

export default JournalPage;