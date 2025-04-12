import React from 'react';
import './JournalCard.css';

const JournalCard = ({ journal, onClick, isSelected }) => {
  return (
    <div 
      className={`journal-card ${isSelected ? 'selected' : ''}`}
      style={{ '--journal-color': journal.color }}
      onClick={() => onClick(journal.id)}
    >
      <div className="journal-bookmark"></div>
      <div className="journal-line-pattern"></div>
      <div className="journal-card-content">
        <h3>{journal.title}</h3>
        <div className="journal-year">{journal.year}</div>
      </div>
    </div>
  );
};

export default JournalCard;