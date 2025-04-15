import React, { useState } from 'react';
import JournalForm from '../components/JournalForm/JournalForm';
import JournalsList from '../components/Journals/JournalsList'; // Assuming you have this component
import { api } from '../services/api';
import '../styles/JournalsPage.css';

const JournalPage = () => {
    const [refreshFlag, setRefreshFlag] = useState(false);
  
    const handleJournalUpdate = () => {
      setRefreshFlag(!refreshFlag);
    };
  
    return (
      <div className="journal-page">
        <div className="journals-header">
        <h1>My Journals</h1>
        </div>
        <JournalsList refreshFlag={refreshFlag} onJournalUpdate={handleJournalUpdate} />
        </div>
    );
  };
  
  export default JournalPage;