// src/components/Navbar.js
import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const goBack = () => {
    if (location.pathname !== '/') {
      navigate(-1);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user'); // optional if you're persisting user
    setUser(null);
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="nav-left">
        <button className="back-btn" onClick={goBack}>⬅ Back</button>
        <Link className="nav-logo" to="/">🚆 RailSys</Link>
      </div>
      <div className="nav-links">
        {user && (
          <>
            <Link to="/dashboard">Dashboard</Link>
            {user.role === 'Passenger' && (
              <>
                <Link to="/book-train">Book Train</Link>
                <Link to="/view-schedule">View Schedule</Link>
                <Link to="/travel-history">Travel History</Link>
              </>
            )}
            {user.role === 'Staff' && (
              <Link to="/manage-rides">Manage Rides</Link>
            )}
            {user.role === 'Admin' && <Link to="/admin">Admin Panel</Link>}
            <button onClick={handleLogout} className="logout-btn">Logout</button>
          </>
        )}
        {!user && (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;