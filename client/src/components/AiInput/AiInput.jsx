import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import './AiInput.css';

const AiInput = ({ onPromptGenerated, setLoading }) => {
  const [customPrompt, setCustomPrompt] = useState('');
  const [isInputVisible, setInputVisible] = useState(false);

  const handleGenerateCustomPrompt = async () => {
    if (!customPrompt.trim()) {
      return;
    }

    setLoading(true);
    try {
      // Send the custom input to the backend
      const response = await api.post('/ai-prompt/custom', { 
        customInput: customPrompt.trim() 
      });
      
      // Handle the response
      if (response && response.prompt) {
        onPromptGenerated(response.prompt);
      }
    } catch (err) {
      console.error('Error generating custom prompt:', err);
    } finally {
      setLoading(false);
      setCustomPrompt('');
      setInputVisible(false);
    }
  };

  return (
    <div className="ai-input-container">
      {!isInputVisible ? (
        <button 
          className="toggle-input-button glowing-button"
          onClick={() => setInputVisible(true)}
          type="button"
        >
          Customize Prompt with AI
        </button>
      ) : (
        <div className="custom-prompt-input">
          <input
            type="text"
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            placeholder="Enter your mood and keywords"
            autoFocus
          />
          <div className="input-actions">
            <button 
              onClick={() => setInputVisible(false)}
              className="cancel-button"
              type="button"
            >
              Cancel
            </button>
            <button 
              onClick={handleGenerateCustomPrompt}
              className="generate-button glowing-button"
              disabled={!customPrompt.trim()}
              type="button"
            >
              Generate
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AiInput;