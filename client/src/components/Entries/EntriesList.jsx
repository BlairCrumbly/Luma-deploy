import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';

const EntriesList = () => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchEntries = async () => {
      try {
        const data = await api.get('/entries'); // Calls your backend route /entries
        setEntries(data);
      } catch (err) {
        console.error('Error fetching entries:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchEntries();
  }, []);

  if (loading) return <div>Loading entries...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="entries-list">
      <h2>Your Entries</h2>
      {entries.length === 0 ? (
        <div>No entries found.</div>
      ) : (
        <ul>
          {entries.map((entry) => (
            <li key={entry.id} className="entry-item">
              <h3>{entry.title}</h3>
              <p>{entry.content}</p>
              {/* Render other entry details as needed */}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default EntriesList;
