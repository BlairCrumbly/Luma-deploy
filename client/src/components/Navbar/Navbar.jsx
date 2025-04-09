// Navbar.jsx
import React from 'react';
import { Link,  useNavigate } from 'react-router-dom'; // To navigate between routes
import './Navbar.css'
import { useState, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext'; // Import AuthContext




const Navbar = () => {
    const { currentUser, logout } = useContext(AuthContext);
    const [isOpen, setIsOpen] = useState(false);
    const navigate = useNavigate();
  
    // If there's no logged-in user, do not render the Navbar
    if (!currentUser) return null;
  
    // Toggle the navbar (open/close)
    const toggleMenu = () => {
      setIsOpen(!isOpen);
    };
  
    // Handle logout and redirect to login
    const handleLogout = async () => {
      try {
        await logout();
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
            <Link to="/">Home</Link>
          </li>
          <li className="nav-link">
            <Link to="/journals">Journals</Link>
          </li>
          <li className="nav-link">
            <Link to="/entries">Entries</Link>
          </li>
          <li className="nav-link">
            <Link to="/journals/new">New Journal</Link>
          </li>
          <li className="nav-link">
            <Link to="/journal/new-entry">New Entry</Link>
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