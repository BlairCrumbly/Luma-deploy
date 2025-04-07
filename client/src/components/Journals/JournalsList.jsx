import './JournalsList.css';
import { useState, useEffect } from "react"
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
  
    if (loading) return <div>Loading journals...</div>;
    
  
    return (
      <div className="journals-list">
        <h2>Your Journals</h2>
        {journals.length === 0 ? (
          <div>No journals found.</div>
        ) : (
          <ul>
            {journals.map((journal) => (
              <li key={journal.id} className="journal-item" style={{ backgroundColor: journal.color }}>
                <h3>{journal.title} ({journal.year})</h3>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  };
  
  export default JournalsList;
  