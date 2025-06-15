import './JournalsList.css';
import { useState, useEffect } from "react";
import { api } from '../../services/api';
import JournalCard from '../JournalCard/JournalCard';
import EntriesList from '../Entries/EntriesList';
import JournalEditForm from '../JournalEditForm/JournalEditForm';
import ConfirmationModal from '../UserProfile/ConfirmationModal'; 
import { Link } from 'react-router-dom';

const JournalsList = ({ refreshFlag, onJournalUpdate }) => {
  const [journals, setJournals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedJournalId, setSelectedJournalId] = useState(null);
  const [editingJournal, setEditingJournal] = useState(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [journalToDelete, setJournalToDelete] = useState(null);

  useEffect(() => {
    fetchJournals();
  }, [refreshFlag]);

  const fetchJournals = async () => {
    try {
      setLoading(true);
      const data = await api.get('/journals');
      setJournals(data);
    } catch (err) {
      setError(err.message || 'Failed to load journals');
    } finally {
      setLoading(false);
    }
  };

  const handleCardClick = (journalId) => {
    console.log(`Clicked on journal with ID: ${journalId}`);
    setSelectedJournalId(journalId);
    setEditingJournal(null); 
  };

  const handleEditClick = (journal, e) => {
    e.stopPropagation(); 
    setEditingJournal(journal);
    setSelectedJournalId(null); 
  };

  const handleDeleteClick = (journal, e) => {
    e.stopPropagation(); 
    setJournalToDelete(journal);
    setShowDeleteModal(true);
  };

  const confirmDeleteJournal = async () => {
    if (!journalToDelete) return;
    try {
      await api.delete(`/journals/${journalToDelete.id}`);
      setJournals(journals.filter(journal => journal.id !== journalToDelete.id));
      

      if (selectedJournalId === journalToDelete.id) {
        setSelectedJournalId(null);
      }
      
      if (onJournalUpdate) {
        onJournalUpdate();
      }
    } catch (err) {
      setError('Failed to delete journal: ' + (err.message || 'Unknown error'));
    } finally {
      setShowDeleteModal(false);
      setJournalToDelete(null);
    }
  };

  const handleUpdateSuccess = () => {
    fetchJournals();
    setEditingJournal(null);
    if (onJournalUpdate) {
      onJournalUpdate();
    }
  };

  if (loading && journals.length === 0) {
    return <div className="loading-indicator">Loading journals...</div>;
  }

  return (
    <div className="journals-page">
      {error && <div className="error-message">{error}</div>}
      
      <div className="journals-list">
        {journals.length === 0 ? (
          <div className="no-journals-message">
            <p>No journals found. Start by making your first journal!</p>
            <Link to={"/journals/new"} className="create-journal-button">Create Journal</Link>
          </div>
        ) : (
          <div className="card-container">
            {journals.map((journal) => (
              <JournalCard
                key={journal.id} 
                journal={journal} 
                onClick={handleCardClick}
                isSelected={selectedJournalId === journal.id}
                onEdit={handleEditClick}
                onDelete={handleDeleteClick}
              />
            ))}
          </div>
        )}
      </div>

      {/* Show edit form if editing a journal */}
      {editingJournal && (
        <div className="journal-edit-container">
          <h2>Edit Journal</h2>
          <JournalEditForm 
            journal={editingJournal} 
            onSuccess={handleUpdateSuccess} 
            onCancel={() => setEditingJournal(null)} 
          />
        </div>
      )}
      
      {/* Show entries for the selected journal */}
      {selectedJournalId && (
        <div className="selected-journal-entries">
          <h2>Journal Entries</h2>
          <EntriesList journalId={selectedJournalId} />
        </div>
      )}

      {/* Confirmation modal for deleting a journal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        message="Are you sure you want to delete this journal? This will also delete associated entries. This action cannot be undone."
        onCancel={() => {
          setShowDeleteModal(false);
          setJournalToDelete(null);
        }}
        onConfirm={confirmDeleteJournal}
      />
    </div>
  );
};

export default JournalsList;