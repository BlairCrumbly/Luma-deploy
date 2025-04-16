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

//! Register ChartJS components
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
    const processedData = processEntriesForMoodGraph(entriesData || []);
    setChartData(processedData);
  }, [entriesData]);

  const processEntriesForMoodGraph = (entries) => {

    const today = new Date();
    

    const dateLabels = [];
    const moodDataPoints = [];
    
    let startDate;
    
    if (entries.length === 0) {

      startDate = today;
    } else {

      const sortedEntries = [...entries].sort((a, b) => 
        new Date(a.created_at) - new Date(b.created_at)
      );
      
      const firstEntryDate = new Date(sortedEntries[0].created_at);
      const daysSinceFirstEntry = Math.ceil(
        (today - firstEntryDate) / (1000 * 60 * 60 * 24)
      );
      
      //! If they have less than 7 days of history, adjust the start date
      if (daysSinceFirstEntry < 6) {
        startDate = firstEntryDate;
      } else {
        //! If they have more than 7 days, show the most recent 6 days plus today
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 6);
      }
    }
    
    //! Generate 7 days of data starting from startDate
    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      
      const dateStr = date.toLocaleDateString('en-US', { 
        month: 'short',
        day: 'numeric'
      });
      
      dateLabels.push(dateStr);
      
      const dayEntries = entries.filter(entry => {
        const entryDate = new Date(entry.created_at);
        return entryDate.getDate() === date.getDate() && 
               entryDate.getMonth() === date.getMonth() && 
               entryDate.getFullYear() === date.getFullYear();
      });
      
      //! Calculate average mood for the day IF entries exist
      let dayMoodScore = null;
      if (dayEntries.length > 0) {
        let totalScore = 0;
        let totalMoodCount = 0;
        
        dayEntries.forEach(entry => {
          if (entry.moods && entry.moods.length > 0) {
            totalScore += entry.moods.reduce((sum, mood) => sum + mood.score, 0);
            totalMoodCount += entry.moods.length;
          }
        });
        
        if (totalMoodCount > 0) {
          dayMoodScore = totalScore / totalMoodCount;
        }
      }
      
      moodDataPoints.push(dayMoodScore);
    }

    return {
      labels: dateLabels,
      datasets: [
        {
          label: 'Mood Score',
          data: moodDataPoints,
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
          spanGaps: true, //! connect the line across null values
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
            if (context.raw === null) {
              return 'No mood data';
            }
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
      <h3>Your Weekly Mood Trends</h3>
      <Line data={chartData} options={options} />
    </div>
  );
};

export default MoodLineGraph;