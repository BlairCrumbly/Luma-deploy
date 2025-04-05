import React, { useEffect, useState } from 'react';

const Dashboard = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    // Simulate an API call to fetch user data (replace with actual API call)
    setTimeout(() => {
      setData({
        name: 'John Doe',
        tasks: 5,
      });
    }, 1000);
  }, []);

  return (
    <div>
      <h1>Welcome to the Dashboard</h1>
      {data ? (
        <div>
          <p>Hello, {data.name}!</p>
          <p>You have {data.tasks} tasks to complete.</p>
        </div>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
};

export default Dashboard;
