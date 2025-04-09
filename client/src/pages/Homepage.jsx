import React, { useContext, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../components/contexts/AuthContext';
import { api } from '../services/api';
import JournalCard from '../components/JournalCard/JournalCard';
import CalendarHeatmap from 'react-calendar-heatmap';
import 'react-calendar-heatmap/dist/styles.css';
import '../styles/Homepage.css';
import EntryForm from '../components/EntryForm/EntryForm';

const HomePage = () => {
  const { currentUser } = useContext(AuthContext);
  const [recentJournals, setRecentJournals] = useState([]);
  const [latestEntries, setLatestEntries] = useState([]);
  const [entriesHeatmap, setEntriesHeatmap] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // State for current month view
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        // Fetch journals
        const journalsData = await api.get('/journals');
        // Sort by ID (and take 4
        const sortedJournals = journalsData.sort((a, b) => b.id - a.id).slice(0, 5);
        setRecentJournals(sortedJournals);

        // Fetch entries
        const entriesData = await api.get('/entries');
        // Sort by creation date and take 4 most recent
        const recentEntries = entriesData
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
          .slice(0, 4);
        setLatestEntries(recentEntries);

        // Process entries for heatmap
        const entryDates = entriesData.reduce((acc, entry) => {
          const date = entry.created_at.split('T')[0]; // Get YYYY-MM-DD format
          acc[date] = (acc[date] || 0) + 1;
          return acc;
        }, {});

        const heatmapData = Object.keys(entryDates).map(date => ({
          date,
          count: entryDates[date]
        }));

        setEntriesHeatmap(heatmapData);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching homepage data:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchHomeData();
  }, []);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric',
      month: 'short', 
      day: 'numeric'
    });
  };

  const handleJournalClick = (journalId) => {
    // Navigate to journal entries
    window.location.href = `/journal/${journalId}/entries`;
  };

  // Function to get the first day of the current month
  const getStartDate = () => {
    const start = new Date(currentDate);
    start.setDate(1);
    return start;
  };

  // Function to get the last day of the current month
  const getEndDate = () => {
    const end = new Date(currentDate);
    end.setMonth(end.getMonth() + 1, 0);
    return end;
  };

  // Function to navigate to previous month
  const goToPreviousMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() - 1);
    setCurrentDate(newDate);
  };

  // Function to navigate to next month
  const goToNextMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + 1);
    setCurrentDate(newDate);
  };

  // Function to format month name
  const formatMonthYear = (date) => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  if (loading) return <div className="loading">Loading your dashboard...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div className="homepage-container">
      <div className="homepage-header">
        <h1>Welcome, {currentUser?.username}!</h1>
        <p className="subtitle">Your journaling dashboard</p>
      </div>

      <div className="homepage-section">
        <div className="section-header">
          <h2>Recent Journals</h2>
          <Link to="/journals" className="view-all-link">View All</Link>
        </div>
        
        <div className="journals-row">
          {recentJournals.length === 0 ? (
            <div className="no-data-message">
              <p>No journals yet. Create your first journal to start writing!</p>
              <Link to="/journals/new" className="create-button">Create Journal</Link>
            </div>
          ) : (
            <>
              {recentJournals.map(journal => (
                <JournalCard 
                  key={journal.id} 
                  journal={journal} 
                  onClick={handleJournalClick}
                />
              ))}
              <Link to="/journals/new" className="add-journal-card">
                <div className="add-icon">+</div>
                <div>New Journal</div>
              </Link>
            </>
          )}
        </div>
      </div>

      <div className="homepage-section">
        <div className="section-header">
          <h2>Latest Entries</h2>
          <Link to="/entries" className="view-all-link">View All</Link>
        </div>
        
        <div className="entries-grid">
          {latestEntries.length === 0 ? (
            <div className="no-data-message">
              <p>No entries yet. Create your first entry to begin your journey!</p>
              <Link to="/journal/new-entry" className="create-button">Write Entry</Link>
            </div>
          ) : (
            latestEntries.map(entry => (
              <Link to={`/entry/${entry.id}`} key={entry.id} className="entry-card">
                <h3>{entry.title}</h3>
                <div className="entry-preview">
                  {entry.main_text.length > 100 
                    ? `${entry.main_text.substring(0, 100).replace(/<[^>]*>/g, '')}...`
                    : entry.main_text.replace(/<[^>]*>/g, '')}
                </div>
                <div className="entry-footer">
                  <span className="entry-date">{formatDate(entry.created_at)}</span>
                  <div className="entry-moods">
                    {entry.moods && entry.moods.map(mood => (
                      <span key={mood.id} className="mood-emoji">{mood.emoji}</span>
                    ))}
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>

      <div className="homepage-section">
        <div className="section-header">
          <h2>Your Writing Activity</h2>
        </div>
        
        {/* <div className="calendar-navigation">
          <button onClick={goToPreviousMonth} className="calendar-nav-btn">
            &larr; Prev
          </button>
          <h3 className="current-month">{formatMonthYear(currentDate)}</h3>
          <button onClick={goToNextMonth} className="calendar-nav-btn">
            Next &rarr;
          </button>
        </div> */}
        
        <div className="heatmap-container">
          <CalendarHeatmap
            startDate={new Date(new Date().setFullYear(new Date().getFullYear() - 1))}
            endDate={new Date()}
            values={entriesHeatmap}
            classForValue={(value) => {
              if (!value) {
                return 'color-empty';
              }
              return `color-scale-${Math.min(value.count, 4)}`;
            }}
            tooltipDataAttrs={(value) => {
              if (!value || !value.date) {
                return null;
              }
              return {
                'data-tip': `${value.date}: ${value.count} entries`,
              };
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default HomePage;