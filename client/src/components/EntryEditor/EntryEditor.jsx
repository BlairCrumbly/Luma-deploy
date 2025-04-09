import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import ReactQuill from 'react-quill'; // Import React Quill
import 'react-quill/dist/quill.snow.css'; // Import Quill styles
import { api } from '../../services/api';
import './EntryEditor.css';

const EntryEditor = () => {
  const { entryId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const isNewEntry = location.state?.isNewEntry || false;
  const requestedAiPrompt = location.state?.aiPrompt || false;

  const [entry, setEntry] = useState(null);
  const [editorContent, setEditorContent] = useState(''); // Content for React Quill
  const [aiPrompt, setAiPrompt] = useState('');
  const [moods, setMoods] = useState([]); // Assuming moods are selected by the user
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
          // Ensure the entryId is valid and used in the request
          const entryData = await api.get(`/entries/${entryId}`);
          setEntry(entryData);
          setEditorContent(entryData.main_text || ''); // Set the content for React Quill
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

  // Handle content changes
  const handleEditorChange = (content) => {
    setEditorContent(content);
    setUnsavedChanges(true);
  };

  // Save entry
  const handleSave = async () => {
    try {
      setSaving(true);
  
      // Validate that there is content to save
      if (!editorContent.trim()) {
        setError('Please enter some text to save.');
        return;
      }
  
      const requestData = {
        main_text: editorContent // Send only the updated content
      };
  
      console.log('Sending PATCH request data:', requestData);
  
      // Send PATCH request to update the entry
      const response = await api.patch(`/entries/${entryId}`, requestData); // Use entryId from the URL
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
  

  // Warn before leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (unsavedChanges) {
        e.preventDefault();
        e.returnValue = ''; // This message is not displayed in modern browsers
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
      {/* Entry Header */}
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

      {/* React-Quill Editor */}
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
