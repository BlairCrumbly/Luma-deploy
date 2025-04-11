import React, { useState, useEffect } from 'react';
import { OpenAI } from 'openai';
import './AiInput.css';

const AiInput = ({ onPromptGenerated, setLoading }) => {
  const [error, setError] = useState('');
  const [rateLimitExceeded, setRateLimitExceeded] = useState(false);
  
  // Fallback prompts to use when API limits are reached
  const FALLBACK_PROMPTS = [
    "What was the most meaningful conversation you had today?",
    "Describe a moment today that made you feel grateful.",
    "What's something you learned or realized today?",
    "If you could change one decision you made today, what would it be?",
    "What's something that challenged you today and how did you handle it?",
    "Write about something that surprised you today.",
    "What are you looking forward to tomorrow?",
    "What's one thing you did today that you're proud of?",
    "Describe something beautiful you saw today.",
    "What's a habit you want to develop or break?"
  ];

  // Usage tracking in localStorage
  const initializeUsageTracking = () => {
    const today = new Date().toISOString().split('T')[0];
    const storedUsage = localStorage.getItem('aiPromptUsage');
    
    if (!storedUsage) {
      // Initialize with zero usage for today
      localStorage.setItem('aiPromptUsage', JSON.stringify({ date: today, count: 0 }));
      return { date: today, count: 0 };
    }
    
    const usage = JSON.parse(storedUsage);
    
    // Reset if it's a new day
    if (usage.date !== today) {
      localStorage.setItem('aiPromptUsage', JSON.stringify({ date: today, count: 0 }));
      return { date: today, count: 0 };
    }
    
    return usage;
  };

  const incrementUsage = () => {
    const usage = initializeUsageTracking();
    usage.count += 1;
    localStorage.setItem('aiPromptUsage', JSON.stringify(usage));
    return usage.count;
  };

  const getUsageCount = () => {
    const usage = initializeUsageTracking();
    return usage.count;
  };

  const generatePrompt = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Check if we've exceeded our daily limit (50 requests for free tier)
      const currentUsage = getUsageCount();
      if (currentUsage >= 45) { // Set slightly below 50 for safety
        setRateLimitExceeded(true);
        const fallbackPrompt = FALLBACK_PROMPTS[Math.floor(Math.random() * FALLBACK_PROMPTS.length)];
        onPromptGenerated(fallbackPrompt);
        setLoading(false);
        return;
      }

      // Add rate limiting with exponential backoff for retries
      const client = new OpenAI({
        baseURL: import.meta.env.MOONSHOT_API_URL || "https://openrouter.ai/api/v1",
        apiKey: import.meta.env.MOONSHOT_API_KEY,
        dangerouslyAllowBrowser: true // Required for client-side usage
      });

      // System prompt to generate a journaling prompt
      const completion = await client.chat.completions.create({
        extra_headers: {
          "HTTP-Referer": window.location.origin,
          "X-Title": "JournalApp"
        },
        model: "moonshotai/kimi-vl-a3b-thinking:free",
        messages: [
          {
            role: "system",
            content: "You are a thoughtful journaling assistant. Generate a single, insightful journaling prompt that encourages self-reflection. Keep it to one sentence and make it thought-provoking."
          },
          {
            role: "user",
            content: "Create a journal prompt for today."
          }
        ],
        max_tokens: 80 // Keep responses short to conserve tokens
      });

      // Track this successful API call
      incrementUsage();
      
      // Extract the generated prompt
      const generatedPrompt = completion.choices[0].message.content.trim();
      onPromptGenerated(generatedPrompt);
      
    } catch (err) {
      console.error('Error generating AI prompt:', err);
      
      // Handle different error types
      if (err.status === 402 || err.status === 429) {
        setRateLimitExceeded(true);
      }
      
      // Use fallback prompt
      const fallbackPrompt = FALLBACK_PROMPTS[Math.floor(Math.random() * FALLBACK_PROMPTS.length)];
      onPromptGenerated(fallbackPrompt);
      
      setError('Could not generate an AI prompt. Using a default prompt instead.');
    } finally {
      setLoading(false);
    }
  };

  // Use the server endpoint if available
  const getServerPrompt = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/ai-prompt', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }
      
      const data = await response.json();
      onPromptGenerated(data.prompt);
      
    } catch (err) {
      console.error('Error fetching server prompt:', err);
      
      // Fall back to client-side generation
      await generatePrompt();
      
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // The component doesn't auto-generate a prompt on mount
    // It will be triggered by user action in the parent component
  }, []);

  return (
    <div className="ai-input-container">
      {error && <div className="ai-error">{error}</div>}
      {rateLimitExceeded && (
        <div className="rate-limit-warning">
          Daily AI prompt limit reached. Using creative backup prompts instead.
        </div>
      )}
    </div>
  );
};

export default AiInput;