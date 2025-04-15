import React from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { api } from '../../services/api';
import ColorPicker from '../JournalForm/colorpicker';
import './JournalEditForm.css';
import toast from 'react-hot-toast';

const JournalEditForm = ({ journal, onSuccess, onCancel }) => {
  const JournalSchema = Yup.object().shape({
    title: Yup.string()
      .required('Title is required')
      .min(2, 'Title must be at least 2 characters'),
    year: Yup.number()
      .required('Year is required')
      .integer('Year must be a whole number')
      .min(1900, 'Year must be 1900 or later')
      .max(new Date().getFullYear() + 15, 'Year cannot be too far in the future'),
    color: Yup.string()
      .required('Color is required')
      .matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Must be a valid hex color')
  });

  const handleSubmit = async (values, { setSubmitting, setStatus }) => {
    try {
      await api.put(`/journals/${journal.id}`, values);
      
      toast.success('Journal updated successfully!');
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      toast.error('Error updating journal');
      
      // Check if it's a unique constraint violation error
      if (err.message && err.message.includes('UNIQUE constraint failed: journals.title')) {
        setStatus({ error: 'A journal with this title already exists. Please use a different title.' });
      } else {
        setStatus({ error: 'Error updating journal. Please try again.' });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="journal-edit-form-container">
      <Formik
        initialValues={{
          title: journal.title,
          year: journal.year,
          color: journal.color
        }}
        validationSchema={JournalSchema}
        onSubmit={handleSubmit}
      >
        {({ isSubmitting, values, setFieldValue, status }) => (
          <Form className="journal-edit-form">
            <div className="form-group">
              <label htmlFor="title">Title</label>
              <Field
                type="text"
                name="title"
                id="title"
                className="form-control"
              />
              <ErrorMessage name="title" component="div" className="error-message" />
            </div>
            
            <div className="form-group">
              <label htmlFor="year">Year</label>
              <Field
                type="number"
                name="year"
                id="year"
                className="form-control"
              />
              <ErrorMessage name="year" component="div" className="error-message" />
            </div>
            
            <div className="form-group color-picker-container">
              <label>Journal Color:</label>
              <ColorPicker
                selectedColor={values.color}
                setSelectedColor={(color) => setFieldValue('color', color)}
              />
              <ErrorMessage name="color" component="div" className="error-message" />
            </div>
            
            {status && status.error && (
              <div className="error-message">{status.error}</div>
            )}
            
            <div className="form-buttons">
              <button
                type="button"
                className="cancel-button"
                onClick={onCancel}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="submit-button"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Updating...' : 'Update Journal'}
              </button>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
};

export default JournalEditForm;