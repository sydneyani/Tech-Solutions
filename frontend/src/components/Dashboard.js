// Dashboard.js
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
          <Link to="/view-schedule" className="dash-btn">📅 View Schedule</Link>
          
          {/* Book Train button for both Passenger and Staff */}
          {(user.role === 'Passenger' || user.role === 'Staff') && (
            <Link to="/book-train" className="dash-btn">🚆 Book a Train</Link>
          )}
          
          {/* Travel History button for both Passenger and Staff */}
          {(user.role === 'Passenger' || user.role === 'Staff') && (
            <Link to="/travel-history" className="dash-btn">📜 Travel History</Link>
          )}
          
          {/* Admin-specific buttons */}
          {user.role === 'Admin' && (
            <>
              <Link to="/admin" className="dash-btn">⚙️ Admin Panel</Link>
              <Link to="/reports" className="dash-btn">📊 Report Generation</Link>
              <Link to="/register" className="dash-btn">👤 Register New Users</Link>
            </>
          )}
          
          {/* Staff-specific button */}
          {user.role === 'Staff' && (
            <Link to="/manage-rides" className="dash-btn">🧾 Manage Rides</Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
