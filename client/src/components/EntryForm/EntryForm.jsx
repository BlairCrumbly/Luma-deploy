import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import './EntryForm.css';

const EntryForm = ({ journalId }) => {
  const [title, setTitle] = useState('');
  const [selectedMoods, setSelectedMoods] = useState([]);
  const [availableMoods, setAvailableMoods] = useState([]);
  const [isAiPrompt, setIsAiPrompt] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Fetch available moods on component mount
  useEffect(() => {
    const fetchMoods = async () => {
      try {
        const moods = await api.get('/moods');
        setAvailableMoods(moods);
      } catch (err) {
        console.error('Error fetching moods:', err);
        setError('Failed to load moods. Please try again.');
      }
    };

    fetchMoods();
  }, []);

  const handleMoodToggle = (moodId) => {
    setSelectedMoods(prevMoods => {
      if (prevMoods.includes(moodId)) {
        return prevMoods.filter(id => id !== moodId);
      } else {
        return [...prevMoods, moodId];
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validate inputs
      if (!title.trim()) {
        throw new Error('Please enter a title for your entry');
      }
      
      if (selectedMoods.length === 0) {
        throw new Error('Please select at least one mood');
      }

      // Create the new entry
      const newEntry = await api.post('/entries', {
        title,
        journal_id: journalId,
        mood_ids: selectedMoods,
        ai_prompt_used: isAiPrompt
      });

      // Navigate to the entry editor page with the new entry ID
      navigate(`/entry/${newEntry.id}`, { 
        state: { 
          isNewEntry: true,
          aiPrompt: isAiPrompt
        } 
      });
      
    } catch (err) {
      console.error('Error creating entry:', err);
      setError(err.message || 'Failed to create entry. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="entry-form-container">
      <h2>Create New Entry</h2>
      
      <form onSubmit={handleSubmit} className="entry-form">
        <div className="form-group">
          <label htmlFor="title">Title</label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Give your entry a title..."
            required
          />
        </div>

        <div className="form-group">
          <label>How are you feeling?</label>
          <div className="mood-selector">
            {availableMoods.map((mood) => (
              <button
                type="button"
                key={mood.id}
                className={`mood-button ${selectedMoods.includes(mood.id) ? 'selected' : ''}`}
                onClick={() => handleMoodToggle(mood.id)}
                title={`Mood score: ${mood.score}`}
              >
                {mood.emoji}
              </button>
            ))}
          </div>
          {selectedMoods.length === 0 && (
            <p className="mood-hint">Select at least one mood</p>
          )}
        </div>

        <div className="form-group">
          <label>Writing Method</label>
          <div className="writing-method-selector">
            <button
              type="button"
              className={`method-button ${!isAiPrompt ? 'selected' : ''}`}
              onClick={() => setIsAiPrompt(false)}
            >
              Free Write
            </button>
            <button
              type="button"
              className={`method-button ${isAiPrompt ? 'selected' : ''}`}
              onClick={() => setIsAiPrompt(true)}
            >
              AI Prompt
            </button>
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}
        
        <button 
          type="submit" 
          className="submit-button"
          disabled={loading}
        >
          {loading ? 'Creating...' : 'Start Writing'}
        </button>
      </form>
    </div>
  );
};

export default EntryForm;