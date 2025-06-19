import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import './EntriesList.css';

const EntriesList = ({ journalId }) => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchEntries = async () => {
      try {
        // If journalId is provided, fetch entries for that journal
        const endpoint = journalId ? `/api/journals/${journalId}/entries` : '/api/entries';
        const data = await api.get(endpoint);
        
        setEntries(data);
      } catch (err) {
        console.error('Error fetching entries:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchEntries();
  }, [journalId]); // Re-fetch when journalId changes

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) return <div>Loading entries...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="entries-list">
      {entries.length === 0 ? (
        <div className="no-entries">
          <p>No entries found. Start writing your first entry!</p>
          <Link to="/entries/new" className="create-entry-button">Create Entry</Link>
        </div>
      ) : (
        <div className="entries-container">
          {entries.map((entry) => (
            <div className="entry-card" key={entry.id}>
              <h3 className="entry-title">{entry.title}</h3>
              <div className="entry-moods">
                {entry.moods && entry.moods.map((mood, index) => (
                  <span key={index}>{mood.emoji}</span>
                ))}
              </div>
              <div className="entry-preview">
                {entry.main_text.length > 150
                  ? `${entry.main_text.substring(0, 150).replace(/<[^>]*>/g, '')}...`
                  : entry.main_text.replace(/<[^>]*>/g, '')}
              </div>
              <div className="entry-footer">
                <span className="entry-date">{formatDate(entry.created_at)}</span>
                {entry.ai_prompt_used && <span className="ai-badge">AI Prompted</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default EntriesList;