import React from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import './JournalForm.css'; // Ensure you have styling as needed
import { useState } from 'react';
import { api } from '../../services/api';
import ColorPicker from './colorpicker'

const JournalForm = ({ onJournalCreated }) => {
    const [title, setTitle] = useState('');
    const [year, setYear] = useState('');
    const [color, setColor] = useState('#E7E5E5');
    
  
    const handleSubmit = async (e) => {
      e.preventDefault();
      try {
        const newJournal = await api.post('/journals', { title, year, color });
        onJournalCreated(newJournal); // Update parent component
        setTitle('');
        setYear('');
        setColor('#E7E5E5');
        setError('');
      } catch (err) {
        console.error('Error creating journal:', err);
        
      }
    };
  
    return (
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
        <div>
            <label>Pick a color:</label>
            <ColorPicker selectedColor={color} setSelectedColor={setColor} />
        </div>
        <button type="submit">Create Journal</button>
      </form>
    );
  };
  
  export default JournalForm;