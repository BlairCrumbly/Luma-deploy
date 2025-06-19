import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Navbar.css'
import { useState, useContext } from 'react';
import  {AuthContext}  from '../contexts/AuthContext';

const Navbar = () => {
  const { currentUser, logout } = useContext(AuthContext);
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  
  //! If there's no logged-in user, do not render the Navbar
  if (!currentUser) return null;
  
  //! Toggle the navbar (open/close)
  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };
  
  //! Close the menu when a link is clicked
  const handleLinkClick = () => {
    if (isOpen) {
      setIsOpen(false);
    }
  };
  
  // Handle logout and redirect to login
  const handleLogout = async () => {
    try {
      await logout();
      // Close the menu when logging out
      if (isOpen) {
        setIsOpen(false);
      }
      navigate('/login');
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };
  
  return (
    <div className={`navbar ${isOpen ? 'open' : ''}`}>
      <div className="logo">Luma</div>
      
      {/* Hamburger icon - visible on mobile */}
      <div className="hamburger" onClick={toggleMenu}>
        <div className="bar"></div>
        <div className="bar"></div>
        <div className="bar"></div>
      </div>
      
      {/* Navigation links */}
      <ul className={`nav-links ${isOpen ? 'active' : ''}`}>
        <li className="nav-link">
          <Link to="/" onClick={handleLinkClick}>Home</Link>
        </li>
        <li className="nav-link">
          <Link to="/profile" onClick={handleLinkClick}>My Profile</Link>
        </li>
        <li className="nav-link">
          <Link to="/journals" onClick={handleLinkClick}>Journals</Link>
        </li>
        <li className="nav-link">
          <Link to="/entries" onClick={handleLinkClick}>Entries</Link>
        </li>
        <li className="nav-link">
          <Link to="/journals/new" onClick={handleLinkClick}>New Journal</Link>
        </li>
        <li className="nav-link">
          <Link to="/journal/new-entry" onClick={handleLinkClick}>New Entry</Link>
        </li>

        <li className="nav-link">
          {/* Use a button for logout */}
          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </li>
      </ul>
    </div>
  );
};

export default Navbar;