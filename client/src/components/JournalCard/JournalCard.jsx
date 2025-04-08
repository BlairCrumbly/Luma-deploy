import React from 'react';
import './JournalCard.css';

const JournalCard = ({ journal, onClick }) => {
    return (
      <div
        className="journal-card"
        style={{ backgroundColor: journal.color }}
        onClick={() => onClick(journal.id)}
      >
        <div className="journal-card-content">
          <h3>{journal.title} {journal.year}</h3>
        </div>
      </div>
    );
  };
  
  export default JournalCard;
