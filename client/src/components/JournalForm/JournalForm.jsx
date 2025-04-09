import React from 'react';
import { useState } from 'react';
import { api } from '../../services/api';
import ColorPicker from './colorpicker';
import './JournalForm.css'; // Ensure you have styling as needed

const JournalForm = ({ onJournalCreated }) => {
  const [title, setTitle] = useState('');
  const [year, setYear] = useState('');
  const [color, setColor] = useState('#E7E5E5');
  const [error, setError] = useState('');
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const newJournal = await api.post('/journals', { title, year, color });
      // After successfully creating the journal, notify the parent component
      if (onJournalCreated) {
        onJournalCreated(newJournal); // Call the passed function
      }
      // Reset form fields
      setTitle('');
      setYear('');
      setColor('#E7E5E5');
    } catch (err) {
      console.error('Error creating journal:', err);
      setError('Error creating journal. Please try again.');
    }
  };
  
  return (
    <div className="journal-form-container">
      <form onSubmit={handleSubmit} className="journal-form">
        <h3>Create New Journal</h3>
        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <input
          type="number"
          placeholder="Year"
          value={year}
          onChange={(e) => setYear(e.target.value)}
          required
        />
        <div className="color-picker-container">
          <label>Pick a color:</label>
          <ColorPicker selectedColor={color} setSelectedColor={setColor} />
        </div>
        {error && <p className="error">{error}</p>}
        <button type="submit" className="submit-button">Create Journal</button>
      </form>
    </div>
  );
};

export default JournalForm;