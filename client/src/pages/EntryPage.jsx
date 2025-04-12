import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import '../styles/EntriesPage.css';

const EntriesPage = () => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState(null);
  const [filterJournal, setFilterJournal] = useState('all');
  const [journals, setJournals] = useState([]);
  
  // Fetch entries and journals data
  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch entries
      const entriesData = await api.get('/entries');
      // Sort by creation date (newest first)
      const sortedEntries = entriesData.sort((a, b) => 
        new Date(b.created_at) - new Date(a.created_at)
      );
      setEntries(sortedEntries);
      
      // Fetch journals for filter dropdown
      const journalsData = await api.get('/journals');
      setJournals(journalsData);
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching entries data:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Format date 
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

  // Delete entry handler
  const handleDeleteEntry = async (entryId) => {
    try {
      await api.delete(`/entries/${entryId}`);
      // Remove entry from state
      setEntries(prevEntries => prevEntries.filter(entry => entry.id !== entryId));
      // Clear confirmation
      setDeleteConfirmation(null);
    } catch (err) {
      console.error('Error deleting entry:', err);
      toast.failed('Failed to delete entry. Please try again.');
    }
  };

  // Function to confirm deletion
  const confirmDelete = (entryId) => {
    setDeleteConfirmation(entryId);
  };

  // Function to cancel deletion
  const cancelDelete = () => {
    setDeleteConfirmation(null);
  };

  // Handle filter change
  const handleFilterChange = (e) => {
    setFilterJournal(e.target.value);
  };

  // Filter entries based on selected journal
  const filteredEntries = filterJournal === 'all' 
    ? entries 
    : entries.filter(entry => entry.journal_id === parseInt(filterJournal));

  if (loading) return <div className="loading">Loading entries...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div className="entries-page-container">
      <div className="entries-header">
        <h1>Journal Entries</h1>
        <div className="entries-actions">
          <div className="filter-container">
            <label htmlFor="journal-filter">Filter by Journal:</label>
            <select 
              id="journal-filter" 
              value={filterJournal} 
              onChange={handleFilterChange}
              className="journal-filter"
            >
              <option value="all">All Journals</option>
              {journals.map(journal => (
                <option key={journal.id} value={journal.id}>
                  {journal.title}
                </option>
              ))}
            </select>
          </div>
          <Link to="/journal/new-entry" className="new-entry-btn">New Entry</Link>
        </div>
      </div>
      
      {filteredEntries.length === 0 ? (
        <div className="no-entries-message">
          <p>No entries found. {filterJournal !== 'all' ? 'Try selecting a different journal or ' : ''}Start writing your first entry!</p>
          <Link to={"/journal/new-entry"} className="create-entry-button">Create Entry</Link>
        </div>
      ) : (
        <div className="entries-list">
          {filteredEntries.map(entry => (
            <div key={entry.id} className="entry-item">
              <div className="entry-content">
                <Link to={`/entry/${entry.id}`} className="entry-title">
                  {entry.title}
                </Link>
                <div className="entry-meta">
                  <span className="entry-date">{formatDate(entry.created_at)}</span>
                  {entry.journal && (
                    <span className="entry-journal">
                      in <Link to={`/journal/${entry.journal_id}`}>{entry.journal.title}</Link>
                    </span>
                  )}
                </div>
                <div className="entry-preview">
                  {entry.main_text.length > 200 
                    ? `${entry.main_text.substring(0, 200).replace(/<[^>]*>/g, '')}...` 
                    : entry.main_text.replace(/<[^>]*>/g, '')}
                </div>
                <div className="entry-footer">
                  <div className="entry-moods">
                    {entry.moods && entry.moods.map(mood => (
                      <span key={mood.id} className="mood-emoji" title={mood.name}>
                        {mood.emoji}
                      </span>
                    ))}
                  </div>
                  <div className="entry-actions">
                    <Link to={`/entry/${entry.id}`} className="edit-entry-btn">
                      Edit
                    </Link>
                    {deleteConfirmation === entry.id ? (
                      <div className="delete-confirmation">
                        <span>Delete this entry?</span>
                        <div className="confirmation-buttons">
                          <button 
                            onClick={() => handleDeleteEntry(entry.id)}
                            className="confirm-delete-btn"
                          >
                            Yes
                          </button>
                          <button 
                            onClick={cancelDelete}
                            className="cancel-delete-btn"
                          >
                            No
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button 
                        onClick={() => confirmDelete(entry.id)}
                        className="delete-entry-btn"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default EntriesPage;