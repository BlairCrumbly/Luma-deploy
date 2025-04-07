import React from 'react';
import EntriesList from '../components/Entries/EntriesList'; // Adjust the import path as needed

const EntriesPage = () => {
  return (
    <div className="entries-page">
      <h1>All Your Entries</h1>
      <EntriesList />
    </div>
  );
};

export default EntriesPage;
