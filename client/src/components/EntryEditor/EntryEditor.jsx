import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { api } from '../../services/api';
import './EntryEditor.css';

const EntryEditor = () => {
  const { entryId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const isNewEntry = location.state?.isNewEntry || false;
  const requestedAiPrompt = location.state?.aiPrompt || false;

  const [entry, setEntry] = useState(null);
  const [editorContent, setEditorContent] = useState('');
  const [aiPrompt, setAiPrompt] = useState('');
  const [moods, setMoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [unsavedChanges, setUnsavedChanges] = useState(false);

  // Fetch entry data and possibly AI prompt
  useEffect(() => {
    const fetchEntryData = async () => {
      try {
        setLoading(true);
  
        if (isNewEntry) {
          setEntry({ title: '', main_text: '' });
          setEditorContent('');
        } else {
          const entryData = await api.get(`/entries/${entryId}`);
          setEntry(entryData);
          setEditorContent(entryData.main_text || '');
        }
  
        // Handle AI prompt if it's a new entry and requested
        if (isNewEntry && requestedAiPrompt) {
          const promptResponse = await api.get('/ai-prompt');
          setAiPrompt(promptResponse.prompt || 'What would you like to write about today?');
        }
      } catch (err) {
        console.error('Error fetching entry:', err);
        setError('Failed to load entry. Please try again.');
      } finally {
        setLoading(false);
      }
    };
  
    fetchEntryData();
  }, [entryId, isNewEntry, requestedAiPrompt]);

  
  const handleEditorChange = (content) => {
    setEditorContent(content);
    setUnsavedChanges(true);
  };

  //! save
  const handleSave = async () => {
    try {
      setSaving(true);
  
      //! Validate that there is text to save
      if (!editorContent.trim()) {
        setError('Please enter some text to save.');
        return;
      }
  
      const requestData = {
        main_text: editorContent //! Send only the updated content
      };
  
      console.log('Sending PATCH request data:', requestData);
  
      //! PATCH to update
      const response = await api.patch(`/entries/${entryId}`, requestData);
      console.log('Response from API:', response);
  
      setUnsavedChanges(false);
      alert('Entry saved successfully!');
    } catch (err) {
      console.error('Error saving entry:', err);
      setError('Failed to save entry. Please try again.');
    } finally {
      setSaving(false);
    }
  };
  

  //! Warn if changed usnavedd
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (unsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [unsavedChanges]);

  if (loading) return <div className="loading">Loading entry...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!entry) return <div className="error">Entry not found</div>;

  return (
    <div className="entry-editor-container">
      <div className="entry-header">
        <h1>{entry.title}</h1>
        <div className="entry-moods">
          {moods.map(mood => (
            <span key={mood.id} className="mood-emoji" title={`Mood score: ${mood.score}`}>
              {mood.emoji}
            </span>
          ))}
        </div>
        {requestedAiPrompt && aiPrompt && (
          <div className="ai-prompt">
            <h3>Writing Prompt</h3>
            <p>{aiPrompt}</p>
          </div>
        )}
      </div>

      {/* Quill Editor */}
      <div className="editor-wrapper">
        <ReactQuill
          value={editorContent}
          onChange={handleEditorChange}
          modules={{
            toolbar: [
              [{ 'header': '1' }, { 'header': '2' }, { 'font': [] }],
              [{ 'list': 'ordered'}, { 'list': 'bullet' }],
              ['bold', 'italic', 'underline', 'strike'],
              ['link'],
              [{ 'align': [] }],
              ['clean']
            ]
          }}
        />
      </div>

      {/* Save and back buttons */}
      <div className="editor-actions">
        <button className="back-button" onClick={() => navigate(-1)}>Back</button>
        <button 
          className={`save-button ${unsavedChanges ? 'active' : ''}`}
          onClick={handleSave}
          disabled={saving || !unsavedChanges}
        >
          {saving ? 'Saving...' : unsavedChanges ? 'Save Changes' : 'Saved'}
        </button>
      </div>
    </div>
  );
};

export default EntryEditor;
