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
        <h3>{journal.title}</h3>
        <div className="journal-year">{journal.year}</div>
      </div>
    </div>
  );
};

export default JournalCard;
