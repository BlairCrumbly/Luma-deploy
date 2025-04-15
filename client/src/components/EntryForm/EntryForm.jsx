import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { api } from '../../services/api';
import './EntryForm.css';

const EntryForm = () => {
  const [availableMoods, setAvailableMoods] = useState([]);
  const [availableJournals, setAvailableJournals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();


  const EntrySchema = Yup.object().shape({
    title: Yup.string()
      .required('Title is required')
      .min(2, 'Title must be at least 2 characters'),
    journal_id: Yup.string()
      .required('Please select a journal'),
    mood_ids: Yup.array()
      .min(1, 'Please select at least one mood')
      .required('Please select at least one mood'),
    ai_prompt_used: Yup.boolean()
  });

  //! fetch moods ON mount
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


  useEffect(() => {
    const fetchJournals = async () => {
      try {
        const journals = await api.get('/journals');
        setAvailableJournals(journals);
      } catch (err) {
        console.error('Error fetching journals:', err);
        setError('Failed to load journals. Please try again.');
      }
    };

    fetchJournals();
  }, []);

  const handleSubmit = async (values, { setSubmitting }) => {
    setLoading(true);
    setError('');
  
    try {
      //! Create the new entry
      const newEntry = await api.post('/entries', values);
  
      if (!newEntry || !newEntry.id) {
        throw new Error('Failed to create entry. No entry ID returned.');
      }
  
      //! Redirect to EntryEditor to fill in main text
      navigate(`/entry/${newEntry.id}`, { 
        state: { 
          isNewEntry: true,
          aiPrompt: values.ai_prompt_used,
          entryTitle: values.title  // Pass the title to the EntryEditor
        } 
      });
  
    } catch (err) {
      console.error('Error creating entry:', err);
      setError(err.message || 'Failed to create entry. Please try again.');
      setSubmitting(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="entry-form-container">
      <h2>Create New Entry</h2>
      
      <Formik
        initialValues={{
          title: '',
          journal_id: availableJournals.length > 0 ? availableJournals[0].id : '',
          mood_ids: [],
          ai_prompt_used: false
        }}
        enableReinitialize={true}
        validationSchema={EntrySchema}
        onSubmit={handleSubmit}
      >
        {({ values, setFieldValue, isSubmitting }) => (
          <Form className="entry-form">
            <div className="form-group">
              <label htmlFor="title">Title</label>
              <Field
                type="text"
                id="title"
                name="title"
                placeholder="Give your entry a title..."
              />
              <ErrorMessage name="title" component="div" className="error-message" />
            </div>

            <div className="form-group">
              <label htmlFor="journal_id">Select Journal</label>
              <Field
                as="select"
                id="journal_id"
                name="journal_id"
                className="journal-dropdown"
              >
                <option value="">Select a journal</option>
                {availableJournals.map(journal => (
                  <option key={journal.id} value={journal.id}>
                    {journal.name || `Journal ${journal.title}`}
                  </option>
                ))}
              </Field>
              <ErrorMessage name="journal_id" component="div" className="error-message" />
            </div>
            
            <div className="form-group">
              <label>How are you feeling?</label>
              <div className="mood-selector">
                {availableMoods.map((mood) => (
                  <button
                    type="button"
                    key={mood.id}
                    className={`mood-button ${values.mood_ids.includes(mood.id) ? 'selected' : ''}`}
                    onClick={() => {
                      const updatedMoods = values.mood_ids.includes(mood.id)
                        ? values.mood_ids.filter(id => id !== mood.id)
                        : [...values.mood_ids, mood.id];
                      setFieldValue('mood_ids', updatedMoods);
                    }}
                    title={`Mood score: ${mood.score}`}
                  >
                    {mood.emoji}
                  </button>
                ))}
              </div>
              <ErrorMessage name="mood_ids" component="div" className="error-message" />
            </div>

            <div className="form-group">
              <label>Writing Method</label>
              <div className="writing-method-selector">
                <button
                  type="button"
                  className={`method-button ${!values.ai_prompt_used ? 'selected' : ''}`}
                  onClick={() => setFieldValue('ai_prompt_used', false)}
                >
                  Free Write
                </button>
                <button
                  type="button"
                  className={`method-button ${values.ai_prompt_used ? 'selected' : ''}`}
                  onClick={() => setFieldValue('ai_prompt_used', true)}
                >
                  AI Prompt
                </button>
              </div>
            </div>

            {error && <div className="error-message">{error}</div>}
            
            <button 
              type="submit" 
              className="submit-button"
              disabled={isSubmitting || loading}
            >
              {loading || isSubmitting ? 'Creating...' : 'Start Writing'}
            </button>
          </Form>
        )}
      </Formik>
    </div>
  );
};

export default EntryForm;