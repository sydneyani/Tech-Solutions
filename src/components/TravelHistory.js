import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { jsPDF } from 'jspdf'; // Using named import instead
import './TravelHistory.css';

const TravelHistory = () => {
  const { user } = useAuth();
  const [travelHistory, setTravelHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTravelHistory = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Fetch booking history for the logged-in user
        const response = await axios.get(`http://localhost:5000/api/passengers/${user.user_id}/history`);
        
        console.log('Travel history data:', response.data);
        setTravelHistory(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching travel history:', err);
        setError('Failed to load travel history. Please try again later.');
        setLoading(false);
      }
    };

    fetchTravelHistory();
  }, [user]);

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return 'N/A';
    return timeStr.substring(0, 5); // format HH:MM from HH:MM:SS
  };

  // Simplified PDF generation without using autoTable
  const downloadPDF = () => {
    try {
      // Create a new jsPDF instance
      const doc = new jsPDF();
      
      console.log('jsPDF instance created:', doc);
      
      // Add title
      doc.setFontSize(18);
      doc.text('Travel History', 14, 22);
      
      // Add user info
      doc.setFontSize(12);
      doc.text(`Passenger: ${user.first_name || ''} ${user.last_name || ''}`, 14, 30);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 36);
      
      // Add header lines
      doc.setFontSize(10);
      doc.setTextColor(0, 87, 146); // Blue color for header
      doc.text('Date', 14, 50);
      doc.text('Train', 50, 50);
      doc.text('Route', 100, 50);
      doc.text('Seat', 150, 50);
      doc.text('Status', 170, 50);
      
      // Add line under headers
      doc.setDrawColor(0, 87, 146);
      doc.line(14, 52, 196, 52);
      
      // Reset text color to black for content
      doc.setTextColor(0, 0, 0);
      
      // Add content line by line
      let yPos = 60;
      
      travelHistory.forEach((booking, index) => {
        // If we're near the bottom of the page, add a new page
        if (yPos > 280) {
          doc.addPage();
          yPos = 20;
        }
        
        doc.setFontSize(9);
        doc.text(formatDate(booking.travel_date), 14, yPos);
        doc.text(booking.train_name || 'N/A', 50, yPos);
        doc.text(booking.route_name || 'N/A', 100, yPos);
        doc.text(booking.seat_number || 'N/A', 150, yPos);
        
        // Set color based on status
        if (booking.status === 'Completed') {
          doc.setTextColor(14, 159, 110); // Green
        } else if (booking.status === 'Pending') {
          doc.setTextColor(217, 119, 6); // Orange
        } else {
          doc.setTextColor(0, 0, 0); // Black
        }
        
        doc.text(booking.status || 'Completed', 170, yPos);
        doc.setTextColor(0, 0, 0); // Reset to black
        
        // Add a light line below each entry
        doc.setDrawColor(220, 220, 220);
        doc.line(14, yPos + 2, 196, yPos + 2);
        
        yPos += 10;
      });
      
      // Footer
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.text('RailSys - Your Train Booking Partner', 14, 290);
        doc.text(`Page ${i} of ${pageCount}`, 170, 290);
      }
      
      // Save the PDF
      const pdfName = `travel_history_${user.username || 'user'}_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(pdfName);
      console.log('PDF saved:', pdfName);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please check console for details.');
    }
  };

  if (!user) {
    return (
      <div className="travel-history-container">
        <div className="auth-message">Please log in to view your travel history.</div>
      </div>
    );
  }

  return (
    <div className="travel-history-container">
      <h2>🚆 My Travel History</h2>
      
      {loading ? (
        <div className="loading">Loading travel history...</div>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : travelHistory.length === 0 ? (
        <div className="empty-history">
          <p>You haven't made any train bookings yet.</p>
          <p>Book a train to see your travel history here!</p>
        </div>
      ) : (
        <>
          <div className="history-actions">
            <button 
              className="download-pdf-btn"
              onClick={downloadPDF}
            >
              📄 Download as PDF
            </button>
          </div>
          
          <div className="history-table-container">
            <table className="history-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Train</th>
                  <th>Route</th>
                  <th>Departure</th>
                  <th>Arrival</th>
                  <th>Seat</th>
                  <th>Ticket ID</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {travelHistory.map((booking, index) => (
                  <tr key={index}>
                    <td>{formatDate(booking.travel_date)}</td>
                    <td>{booking.train_name}</td>
                    <td>{booking.route_name || 'N/A'}</td>
                    <td>{formatTime(booking.departure_time)}</td>
                    <td>{formatTime(booking.arrival_time)}</td>
                    <td>{booking.seat_number}</td>
                    <td>{booking.ticket_id || 'N/A'}</td>
                    <td>
                      <span className={`status-badge ${booking.status?.toLowerCase() || 'completed'}`}>
                        {booking.status || 'Completed'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default TravelHistory;