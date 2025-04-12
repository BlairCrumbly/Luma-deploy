import React from 'react';
import { useNavigate } from 'react-router-dom';
import JournalForm from '../components/JournalForm/JournalForm'; 

const JournalFormPage = () => {
    const navigate = useNavigate(); 
  
    const handleJournalCreated = () => {
      navigate('/journals');
    };
  
    return (
      <div>
        

        <JournalForm onJournalCreated={handleJournalCreated} />
      </div>
    );
  };
  
  export default JournalFormPage;