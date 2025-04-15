import React from 'react';
import './ConfirmationModal.css';

const ConfirmationModal = ({ message, onCancel, onConfirm, isOpen }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <p className="modal-message">{message}</p>
        <div className="modal-buttons">
          <button type="button" className="cancel-btn" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className="confirm-delete-btn" onClick={onConfirm}>
            I understand, proceed
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
