import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../contexts/AuthContext';
import { api } from '../../services/api';
import toast from 'react-hot-toast';
import { Calendar, Award, Book, FileText, Trash2 } from 'lucide-react';
import ConfirmationModal from './ConfirmationModal'; // import your new modal
import './UserProfile.css';

const UserProfile = () => {
  const { currentUser, logout } = useContext(AuthContext);
  const [userData, setUserData] = useState({
    username: currentUser?.username || '',
    email: currentUser?.email || '',
    stats: {
      journalCount: 0,
      entryCount: 0,
      longestStreak: 0,
      currentStreak: 0
    }
  });
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const profileData = await api.get('/user/profile');
        const statsData = await api.get('/user/stats');
        setUserData({
          username: profileData.username,
          email: profileData.email,
          stats: {
            journalCount: statsData.journal_count || 0,
            entryCount: statsData.entry_count || 0,
            longestStreak: statsData.longest_streak || 0,
            currentStreak: statsData.current_streak || 0
          }
        });
      } catch (error) {
        console.error('Error fetching user data:', error);
        toast.error('Could not load your profile data');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const handleDeleteAccount = async () => {
    try {
      await api.delete('/user/delete');
      toast.success('Your account has been deleted');
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error deleting account:', error);
      toast.error('Failed to delete your account. Please try again.');
    }
  };

  if (loading) {
    return <div className="profile-loading">Loading profile data...</div>;
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h1>My Profile</h1>
        <p className="profile-subtitle">Manage your account and view your journaling stats</p>
      </div>

      <div className="profile-sections">
        <div className="profile-section account-info">
          <h2>Account Information</h2>
          <div className="info-item">
            <span className="info-label">Username:</span>
            <span className="info-value">{userData.username}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Email:</span>
            <span className="info-value">{userData.email}</span>
          </div>
        </div>

        <div className="profile-section stats-section">
          <h2>Journaling Statistics</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <Book size={28} />
              <div className="stat-content">
                <div className="stat-value">{userData.stats.journalCount}</div>
                <div className="stat-label">Journals</div>
              </div>
            </div>
            
            <div className="stat-card">
              <FileText size={28} />
              <div className="stat-content">
                <div className="stat-value">{userData.stats.entryCount}</div>
                <div className="stat-label">Entries</div>
              </div>
            </div>
            
            <div className="stat-card">
              <Award size={28} />
              <div className="stat-content">
                <div className="stat-value">{userData.stats.longestStreak}</div>
                <div className="stat-label">Longest Streak</div>
              </div>
            </div>
            
            <div className="stat-card">
              <Calendar size={28} />
              <div className="stat-content">
                <div className="stat-value">{userData.stats.currentStreak}</div>
                <div className="stat-label">Current Streak</div>
              </div>
            </div>
          </div>
        </div>

        <div className="profile-section important">
          
          <div className="delete-account">
            <div className="delete-info">
              <Trash2 size={24} color="#d63031" />
              <div>
                <h3>Delete Account</h3>
                <p>Permanently delete your account and all data</p>
              </div>
            </div>
            <button 
              type="button"
              className="delete-btn" 
              onClick={() => setShowModal(true)}
            >
              Delete Account
            </button>
          </div>
        </div>
      </div>

      <ConfirmationModal
        isOpen={showModal}
        message="This action cannot be undone. All your journals and entries will be deleted."
        onCancel={() => setShowModal(false)}
        onConfirm={handleDeleteAccount}
      />
    </div>
  );
};

export default UserProfile;
