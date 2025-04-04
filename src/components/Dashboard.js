// ✅ Dashboard.js
import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import './Dashboard.css';

const Dashboard = () => {
  const { user } = useAuth();

  if (!user) return <p className="dashboard-message">Please login to access the dashboard.</p>;

  return (
    <div className="dashboard-container">
      <div className="dashboard-card">
        <h2>Welcome, {user.username}</h2>
        <p className="user-role">Role: <strong>{user.role}</strong></p>

        <div className="dashboard-buttons">
          <Link to="/book-train" className="dash-btn">🚆 Book a Train</Link>
          <Link to="/view-schedule" className="dash-btn">📅 View Schedule</Link>

          {user.role === 'Admin' && (
            <Link to="/admin" className="dash-btn">⚙️ Admin Panel</Link>
          )}

          {user.role === 'Staff' && (
            <Link to="/manage-rides" className="dash-btn">🧾 Manage Rides</Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
