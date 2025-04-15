import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { api } from '../../services/api';
import './EntryEditor.css';
import AiInput from '../AiInput/AiInput';
import toast from 'react-hot-toast';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';

const EntryEditor = () => {
  const { entryId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const isNewEntry = location.state?.isNewEntry || false;
  const requestedAiPrompt = location.state?.aiPrompt || false;

  
  const [entry, setEntry] = useState(null);
  const [aiPrompt, setAiPrompt] = useState('');
  const [moods, setMoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState('');

  
  useEffect(() => {
    const fetchEntryData = async () => {
      try {
        setLoading(true);
  
        if (isNewEntry) {
          // Use the title passed from EntryForm if available
          const initialTitle = location.state?.entryTitle || '';
          setEntry({ title: initialTitle, main_text: '' });
        } else {
          const entryData = await api.get(`/entries/${entryId}`);
          setEntry(entryData);
          
          if (entryData.moods && entryData.moods.length > 0) {
            setMoods(entryData.moods);
          }
        }

        if (isNewEntry && requestedAiPrompt) {
          setAiLoading(true);
          try {
            const promptResponse = await api.get('/ai-prompt');
            setAiPrompt(promptResponse.prompt || 'What would you like to write about today?');
          } catch (err) {
            console.error('Error fetching AI prompt:', err);
            setAiPrompt('What would you like to write about today?');
          } finally {
            setAiLoading(false);
          }
        }
      } catch (err) {
        console.error('Error fetching entry:', err);
        setError('Failed to load entry. Please try again.');
      } finally {
        setLoading(false);
      }
    };
  
    fetchEntryData();
  }, [entryId, isNewEntry, requestedAiPrompt, location.state]);

  
  const validationSchema = Yup.object().shape({
    entryTitle: Yup.string().trim().required('Title is required'),
    editorContent: Yup.string().trim().required('Content is required')
  });

  
  const refreshAiPrompt = async () => {
    setAiLoading(true);
    try {
      const promptResponse = await api.get('/ai-prompt');
      setAiPrompt(promptResponse.prompt || 'What would you like to write about today?');
    } catch (err) {
      console.error('Error refreshing AI prompt:', err);
    } finally {
      setAiLoading(false);
    }
  };

  
  const handlePromptGenerated = (prompt) => {
    setAiPrompt(prompt);
  };

  
  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    try {
      
      const titleToSave = values.entryTitle.trim() || 'Untitled Entry';
      const requestData = {
        title: titleToSave,
        main_text: values.editorContent
      };

      console.log('Sending PATCH request data:', requestData);

      
      const response = await api.patch(`/entries/${entryId}`, requestData);
      console.log('Response from API:', response);

      toast.success('Entry saved successfully!');

      
      setTimeout(() => {
        navigate('/entries');
      }, 700);
    } catch (err) {
      console.error('Error saving entry:', err);
      toast.error('Failed to save entry. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Warn before unloading if there are unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      
      e.preventDefault();
      e.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  if (loading) return <div className="loading">Loading entry...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!entry) return <div className="error">Entry not found</div>;

  return (
    <div className="entry-editor-container">
      <Formik
        enableReinitialize
        initialValues={{
          entryTitle: entry.title || '',
          editorContent: entry.main_text || ''
        }}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {({ values, handleChange, handleSubmit, isSubmitting, setFieldValue, dirty }) => (
          <Form onSubmit={handleSubmit}>
            <div className="entry-header">
              <div className="input-group">
                <input
                  type="text"
                  name="entryTitle"
                  className="entry-title-input"
                  value={values.entryTitle}
                  onChange={handleChange}
                  placeholder="Enter a title for your entry"
                />
                <ErrorMessage name="entryTitle" component="div" className="error-message" />
              </div>

              <div className="entry-moods">
                {moods.map(mood => (
                  <span key={mood.id} className="mood-emoji" title={`Mood score: ${mood.score}`}>
                    {mood.emoji}
                  </span>
                ))}
              </div>

              {requestedAiPrompt && (
                <div className="ai-prompt">
                  <div className="ai-prompt-header">
                    <h3>Writing Prompt</h3>
                    <button
                      type="button"
                      className="refresh-prompt-button"
                      onClick={refreshAiPrompt}
                      disabled={aiLoading}
                    >
                      {aiLoading ? (
                        <span className="ai-prompt-loading"></span>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38" />
                        </svg>
                      )}
                    </button>
                  </div>
                  <p>{aiLoading ? "Generating prompt..." : aiPrompt}</p>
                  <AiInput 
                    onPromptGenerated={handlePromptGenerated}
                    setLoading={setAiLoading}
                  />
                </div>
              )}
            </div>

            
            <div className="editor-wrapper">
              <ReactQuill
                value={values.editorContent}
                onChange={(content) => setFieldValue('editorContent', content)}
                modules={{
                  toolbar: [
                    [{ header: '1' }, { header: '2' }, { font: [] }],
                    [{ list: 'ordered' }, { list: 'bullet' }],
                    ['bold', 'italic', 'underline', 'strike'],
                    ['link'],
                    [{ align: [] }],
                    ['clean']
                  ]
                }}
              />
              <ErrorMessage name="editorContent" component="div" className="error-message" />
            </div>

            
            <div className="editor-actions">
              <button
                type="button"
                className="back-button"
                onClick={() => navigate(-1)}
              >
                Back
              </button>
              <button 
                type="submit"
                className={`save-button ${dirty ? 'active' : ''}`}
                disabled={isSubmitting || !dirty}
              >
                {isSubmitting ? 'Saving...' : dirty ? 'Save Changes' : 'Saved'}
              </button>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
};

export default EntryEditor;
