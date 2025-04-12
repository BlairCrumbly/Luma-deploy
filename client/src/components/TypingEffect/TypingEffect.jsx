import React, { useState, useEffect } from 'react';


const TypingEffect = ({ text, speed = 100 }) => {
    const [displayText, setDisplayText] = useState('');
    const [currentIndex, setCurrentIndex] = useState(0);
    
    useEffect(() => {
      if (currentIndex < text.length) {
        const timer = setTimeout(() => {
          setDisplayText(prevText => prevText + text[currentIndex]);
          setCurrentIndex(prevIndex => prevIndex + 1);
        }, speed);
        
        return () => clearTimeout(timer);
      }
    }, [currentIndex, text, speed]);
    
    return <span>{displayText}<span className="typing-cursor">|</span></span>;
  };

export default TypingEffect