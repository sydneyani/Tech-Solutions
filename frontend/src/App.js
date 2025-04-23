// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

import Navbar from './components/Navbar'; // ✅ NEW
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import AdminPanel from './components/AdminPanel';
import BookTrain from './components/BookTrain';
import ViewSchedule from './components/ViewSchedule';
import ManageRides from './components/ManageRides';
import TravelHistory from './components/TravelHistory'; // ✅ Import TravelHistory component
import Reports from './components/Reports'; // Add this line

import Home from './pages/Home';
import NotFound from './pages/NotFound';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Navbar /> {/* ✅ Navbar at the top */}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/book-train" element={<BookTrain />} />
          <Route path="/view-schedule" element={<ViewSchedule />} />
          <Route path="/manage-rides" element={<ManageRides />} />
          <Route path="/travel-history" element={<TravelHistory />} /> {/* ✅ Add TravelHistory route */}
          <Route path="/reports" element={<Reports />} /> {/* Add this line */}


          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
