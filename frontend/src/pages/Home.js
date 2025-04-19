// src/pages/Home.js
import React from 'react';
import { Link } from 'react-router-dom';
import './Home.css'; // We'll create this

const Home = () => {
  return (
    <div className="home-container">
      <div className="home-card">
        <h1>🚆 Railway Management System</h1>
        <p>Book your train, manage your travel, and ride with ease.</p>
        <div className="home-buttons">
          <Link to="/register"><button className="btn">Register</button></Link>
          <Link to="/login"><button className="btn">Login</button></Link>
        </div>
      </div>
    </div>
  );
};

export default Home;
