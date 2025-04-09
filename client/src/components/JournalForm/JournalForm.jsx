import React from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { api } from '../../services/api';
import ColorPicker from './colorpicker';
import './JournalForm.css';

const JournalForm = ({ onJournalCreated }) => {
  // Define validation schema with Yup
  const JournalSchema = Yup.object().shape({
    title: Yup.string()
      .required('Title is required')
      .min(2, 'Title must be at least 2 characters'),
    year: Yup.number()
      .required('Year is required')
      .integer('Year must be a whole number')
      .min(1900, 'Year must be 1900 or later')
      .max(new Date().getFullYear() + 10, 'Year cannot be too far in the future'),
    color: Yup.string()
      .required('Color is required')
      .matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Must be a valid hex color')
  });

  const handleSubmit = async (values, { setSubmitting, resetForm, setStatus }) => {
    try {
      const newJournal = await api.post('/journals', values);
      
      // After successfully creating the journal, notify the parent component
      if (onJournalCreated) {
        onJournalCreated(newJournal);
      }
      
      resetForm();
      setStatus({ success: 'Journal created successfully!' });
    } catch (err) {
      console.error('Error creating journal:', err);
      setStatus({ error: 'Error creating journal. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="journal-form-container">
      <Formik
        initialValues={{
          title: '',
          year: '',
          color: '#E7E5E5'
        }}
        validationSchema={JournalSchema}
        onSubmit={handleSubmit}
      >
        {({ isSubmitting, values, setFieldValue, status }) => (
          <Form className="journal-form">
            <h3>Create New Journal</h3>
            
            <div className="form-group">
              <Field
                type="text"
                name="title"
                placeholder="Title"
                className="form-control"
              />
              <ErrorMessage name="title" component="div" className="error-message" />
            </div>
            
            <div className="form-group">
              <Field
                type="number"
                name="year"
                placeholder="Year"
                className="form-control"
              />
              <ErrorMessage name="year" component="div" className="error-message" />
            </div>
            
            <div className="form-group color-picker-container">
              <label>Pick a color:</label>
              <ColorPicker 
                selectedColor={values.color} 
                setSelectedColor={(color) => setFieldValue('color', color)} 
              />
              <ErrorMessage name="color" component="div" className="error-message" />
            </div>
            
            {status && status.error && (
              <div className="error-message">{status.error}</div>
            )}
            
            {status && status.success && (
              <div className="success-message">{status.success}</div>
            )}
            
            <button 
              type="submit" 
              className="submit-button" 
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating...' : 'Create Journal'}
            </button>
          </Form>
        )}
      </Formik>
    </div>
  );
};

export default JournalForm;