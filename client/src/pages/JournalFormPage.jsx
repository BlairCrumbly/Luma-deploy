import React from 'react';
import { useNavigate } from 'react-router-dom'; // To navigate after form submission
import JournalForm from '../components/JournalForm/JournalForm';  // Import JournalForm

const JournalFormPage = () => {
    const navigate = useNavigate(); // Used to navigate after the journal is saved
  
    const handleJournalCreated = (newJournal) => {
      console.log('New journal created:', newJournal);
      navigate('/journals'); // After journal is created, navigate to the journals page
    };
  
    return (
      <div>
        <h1>Create a New Journal</h1>
        {/* Pass handleJournalCreated as the onJournalCreated prop */}
        <JournalForm onJournalCreated={handleJournalCreated} />
      </div>
    );
  };
  
  export default JournalFormPage;