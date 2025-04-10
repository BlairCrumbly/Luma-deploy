import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import './EntriesList.css';

const EntriesList = () => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchEntries = async () => {
      try {
        const data = await api.get('/entries'); 
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

  if (loading) return <div className="loading">Loading entries...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div className="entries-list">
      {entries.length === 0 ? (
        <div className="no-entries">
          <p>No entries found. Start writing your first entry!</p>
          <Link to="/new-entry" className="new-entry-button">Create Entry</Link>
        </div>
      ) : (
        <div className="entries-grid">
          {entries.map((entry) => (
            <Link to={`/entry/${entry.id}`} key={entry.id} className="entry-card">
              <div className="entry-header">
                <h3>{entry.title}</h3>
                <div className="entry-moods">
                  {entry.moods && entry.moods.map(mood => (
                    <span key={mood.id} className="mood-emoji">{mood.emoji}</span>
                  ))}
                </div>
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
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default EntriesList;