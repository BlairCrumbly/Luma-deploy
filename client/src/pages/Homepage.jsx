// src/pages/HomePage.js
import React, { useContext } from 'react';
import { AuthContext } from '../components/contexts/AuthContext';

const HomePage = () => {
  const { currentUser, logout } = useContext(AuthContext);
  
  return (
    <div>
      <h1>Welcome, {currentUser?.username}!</h1>

    </div>
  );
};

export default HomePage;