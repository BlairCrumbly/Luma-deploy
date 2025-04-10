import React, { useState } from 'react';
import JournalForm from '../components/JournalForm/JournalForm';
import JournalsList from '../components/Journals/JournalsList'; // Assuming you have this component
import { api } from '../services/api';


const JournalPage = () => {
    const [refreshFlag, setRefreshFlag] = useState(false);
  
    const handleJournalCreated = () => {
      setRefreshFlag(!refreshFlag); // Toggle to re-fetch journals
    };
  
    return (
      <div className="journal-page">
        <h1>My Journals</h1>
        
        <JournalsList/>
      </div>
    );
  };
  
  export default JournalPage;