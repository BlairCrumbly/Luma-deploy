import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import './MoodLineGraph.css'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend,
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend
);

const MoodLineGraph = ({ entriesData }) => {
  const [chartData, setChartData] = useState(null);

  useEffect(() => {
    if (!entriesData || entriesData.length === 0) return;

    // Process entries data to get mood scores over time
    const processedData = processEntriesForMoodGraph(entriesData);
    setChartData(processedData);
  }, [entriesData]);

  const processEntriesForMoodGraph = (entries) => {
    // Group entries by date (using YYYY-MM-DD format)
    const entriesByDate = {};
    const dates = [];
    
    // Sort entries by date
    const sortedEntries = [...entries].sort((a, b) => 
      new Date(a.created_at) - new Date(b.created_at)
    );

    // Get last X entries (adjust number as needed)
    const recentEntries = sortedEntries.slice(-30); // Last 30 entries or days
    
    recentEntries.forEach(entry => {
      const date = new Date(entry.created_at);
      const dateStr = date.toLocaleDateString('en-US', { 
        month: 'short',
        day: 'numeric'
      });
      
      // Calculate average mood score if multiple moods per entry
      let moodScore = 0;
      if (entry.moods && entry.moods.length > 0) {
        moodScore = entry.moods.reduce((sum, mood) => sum + mood.score, 0) / entry.moods.length;
      }
      
      if (!entriesByDate[dateStr]) {
        entriesByDate[dateStr] = {
          totalScore: moodScore,
          count: 1
        };
        dates.push(dateStr);
      } else {
        entriesByDate[dateStr].totalScore += moodScore;
        entriesByDate[dateStr].count += 1;
      }
    });
    
    // Calculate average mood score per day
    const moodData = dates.map(date => {
      return entriesByDate[date].totalScore / entriesByDate[date].count;
    });

    return {
        labels: dates,
        datasets: [
          {
            label: 'Mood Score',
            data: moodData,
            fill: true,
            backgroundColor: (context) => {
              const ctx = context.chart.ctx;
              const gradient = ctx.createLinearGradient(0, 0, 0, 200);
              gradient.addColorStop(0, 'rgba(87, 136, 106, 0.6)');
              gradient.addColorStop(1, 'rgba(66, 111, 84, 0.1)');
              return gradient;
            },
            borderColor: '#426f54',
            tension: 0.4,
            pointRadius: 4,
            pointBackgroundColor: '#57886a',
          },
        ],
      };
      
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          title: function(tooltipItems) {
            return tooltipItems[0].label;
          },
          label: function(context) {
            return `Mood Score: ${parseFloat(context.raw).toFixed(1)}`;
          }
        }
      },
    },
    scales: {
      y: {
        min: 0,
        max: 10,
        title: {
          display: true,
          text: 'Mood Score',
          color: '#666',
          font: {
            size: 12,
          },
        },
        ticks: {
          stepSize: 2,
        },
      },
      x: {
        title: {
          display: true,
          text: 'Date',
          color: '#666',
          font: {
            size: 12,
          },
        },
      },
    },
    maintainAspectRatio: false,
  };

  if (!chartData) {
    return <div className="loading-graph">Loading mood data...</div>;
  }

  return (
    <div className="mood-graph-container" >
      <h3>Mood Trends</h3>
      <Line data={chartData} options={options} />
    </div>
  );
};

export default MoodLineGraph;