import './JournalsList.css';
import { useState, useEffect } from "react"
import {api} from '../../services/api'
import JournalCard from '../JournalCard/JournalCard'

const JournalsList = () => {
    const [journals, setJournals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
  
    useEffect(() => {
      const fetchJournals = async () => {
        try {
          const data = await api.get('/journals');
          setJournals(data);
        } catch (err) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
      };
  
      fetchJournals();
    }, []);
  
    const handleCardClick = (journalId) => {
      console.log(`Clicked on journal with ID: ${journalId}`);
    };
  
    if (loading) return <div>Loading journals...</div>;
  
    return (
      <div className="journals-list">
        
        {journals.length === 0 ? (
          <div>No journals found.</div>
        ) : (
          <div className="card-container">
            {journals.map((journal) => (
              <JournalCard
                key={journal.id}
                journal={journal} //! edit later
                onClick={handleCardClick}
              />
            ))}
          </div>
        )}
      </div>
    );
  };
  
  export default JournalsList;
  