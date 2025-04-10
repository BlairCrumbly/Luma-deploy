import './JournalsList.css';
import { useState, useEffect } from "react"
import {api} from '../../services/api'
import JournalCard from '../JournalCard/JournalCard'
import { Link } from 'react-router-dom';

const JournalsList = () => {
    const [journals, setJournals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filterJournal, setFilterJournal] = useState('all');
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
          <div className="no-journals-message"><p>No journals found. {filterJournal !== 'all' ? 'Try selecting a different journal or ' : ''}Start by making your first journal!</p>
          <Link to={"/journals/new"} className="create-entry-button">Create Journal</Link>
          </div>
          
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
  