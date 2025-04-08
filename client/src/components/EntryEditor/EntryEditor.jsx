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
  const [content, setContent] = useState('');
  const [aiPrompt, setAiPrompt] = useState('');
  const [moods, setMoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [unsavedChanges, setUnsavedChanges] = useState(false);

  // Quill editor modules/formats configuration
  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      ['link', 'blockquote'],
      [{ 'color': [] }, { 'background': [] }],
      ['clean']
    ],
  };

  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list', 'bullet',
    'link', 'blockquote',
    'color', 'background'
  ];

  // Fetch entry data and possibly AI prompt
  useEffect(() => {
    const fetchEntryData = async () => {
      try {
        setLoading(true);
        const entryData = await api.get(`/entries/${entryId}`);
        setEntry(entryData);
        setContent(entryData.main_text || '');
        setMoods(entryData.moods || []);
        
        // If this is a new entry with AI prompt requested
        if (isNewEntry && requestedAiPrompt) {
          try {
            const promptResponse = await api.get('/ai-prompt');
            setAiPrompt(promptResponse.prompt);
          } catch (promptErr) {
            console.error('Error fetching AI prompt:', promptErr);
            setAiPrompt('What would you like to write about today?');
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
  }, [entryId, isNewEntry, requestedAiPrompt]);

  // Handle content changes
  const handleContentChange = (newContent) => {
    setContent(newContent);
    setUnsavedChanges(true);
  };

  // Save entry
  const handleSave = async () => {
    try {
      setSaving(true);
      
      await api.put(`/entries/${entryId}`, {
        main_text: content
      });
      
      setUnsavedChanges(false);
      // Show success message or toast notification here if needed
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
      
      <div className="editor-wrapper">
        <ReactQuill 
          theme="snow"
          value={content}
          onChange={handleContentChange}
          modules={modules}
          formats={formats}
          placeholder="Start writing here..."
        />
      </div>
      
      <div className="editor-actions">
        <button 
          className="back-button"
          onClick={() => navigate(-1)}
        >
          Back
        </button>
        
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