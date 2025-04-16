import { useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import './JournalCard.css';
import useIsMobile from '../Mobile/useIsMobile';

const JournalCard = ({ journal, onEdit, onDelete }) => {
  const isMobile = useIsMobile();
  const [showActions, setShowActions] = useState(false);

  const handleCardClick = () => {
    if (isMobile) {
      setShowActions(prev => !prev); //! toggle visibility on mobile tap
    }
  };

  const handleEditClick = (e) => {
    e.stopPropagation();
    onEdit && onEdit(journal, e);
  };

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    onDelete && onDelete(journal, e);
  };

  return (
    <div 
      className="journal-card" 
      style={{ '--journal-color': journal.color }} 
      onClick={handleCardClick}
    >
      <div className="journal-bookmark"></div>
      <div className="journal-line-pattern"></div>

      <div className="journal-card-content">
        <h3>{journal.title}</h3>
        <div className="journal-year">{journal.year}</div>
      </div>

      {/* Show actions on hover (desktop) or tap (mobile) */}
      {(showActions || !isMobile) && (onEdit || onDelete) && (
        <div className="journal-actions">
          {onEdit && (
            <button 
              className="edit-button" 
              onClick={handleEditClick}
              aria-label="Edit journal"
            >
              <Pencil size={14.5} />
            </button>
          )}
          {onDelete && (
            <button 
              className="delete-button" 
              onClick={handleDeleteClick}
              aria-label="Delete journal"
            >
              <Trash2 size={14.5} />
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default JournalCard;