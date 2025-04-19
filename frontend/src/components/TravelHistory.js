import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { jsPDF } from 'jspdf';
import './TravelHistory.css';

const TravelHistory = () => {
  const { user } = useAuth();
  const [travelHistory, setTravelHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);

  useEffect(() => {
    const fetchTravelHistory = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Determine which endpoint to use based on user role
        let endpoint;
        if (user.role === 'Passenger') {
          endpoint = `${process.env.REACT_APP_API_BASE_URL}/api/passengers/${user.user_id}/history`;
        } else if (user.role === 'Staff') {
          endpoint = `${process.env.REACT_APP_API_BASE_URL}/api/staff/${user.user_id}/history`;
        } else {
          // If role is neither Passenger nor Staff, show error
          setError('Access denied. Only passengers and staff can view travel history.');
          setLoading(false);
          return;
        }
        
        // Fetch booking history
        const response = await axios.get(endpoint);
        
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

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Open payment details modal
  const openPaymentDetails = (booking) => {
    setSelectedBooking(booking);
  };

  // Close payment details modal
  const closePaymentDetails = () => {
    setSelectedBooking(null);
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
      doc.text(`Name: ${user.first_name || ''} ${user.last_name || ''}`, 14, 30);
      doc.text(`Role: ${user.role}`, 14, 36);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 42);
      
      // Add header lines
      doc.setFontSize(10);
      doc.setTextColor(0, 87, 146); // Blue color for header
      doc.text('Date', 14, 56);
      doc.text('Train', 45, 56);
      doc.text('Route', 85, 56);
      doc.text('Seat', 130, 56);
      doc.text('Amount', 150, 56);
      doc.text('Status', 175, 56);
      
      // Add line under headers
      doc.setDrawColor(0, 87, 146);
      doc.line(14, 58, 196, 58);
      
      // Reset text color to black for content
      doc.setTextColor(0, 0, 0);
      
      // Add content line by line
      let yPos = 66;
      
      travelHistory.forEach((booking, index) => {
        // If we're near the bottom of the page, add a new page
        if (yPos > 280) {
          doc.addPage();
          yPos = 20;
        }
        
        doc.setFontSize(9);
        doc.text(formatDate(booking.travel_date), 14, yPos);
        doc.text(booking.train_name || 'N/A', 45, yPos);
        doc.text(booking.route_name || 'N/A', 85, yPos);
        doc.text(booking.seat_number || 'N/A', 130, yPos);
        
        // Add payment amount
        const amountText = booking.amount ? formatCurrency(booking.amount) : 'N/A';
        doc.text(amountText, 150, yPos);
        
        // Set color based on status
        if (booking.status === 'Completed') {
          doc.setTextColor(14, 159, 110); // Green
        } else if (booking.status === 'Pending') {
          doc.setTextColor(217, 119, 6); // Orange
        } else {
          doc.setTextColor(0, 0, 0); // Black
        }
        
        doc.text(booking.status || 'Completed', 175, yPos);
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

  // Payment details modal component - simplified
  const PaymentDetailsModal = ({ booking }) => {
    if (!booking) return null;
    
    return (
      <div className="payment-modal-overlay">
        <div className="payment-modal">
          <div className="payment-modal-header">
            <h3>Payment Details</h3>
            <button className="close-modal-btn" onClick={closePaymentDetails}>×</button>
          </div>
          <div className="payment-modal-content">
            <div className="payment-detail-row">
              <span className="payment-label">Amount:</span>
              <span className="payment-value">{formatCurrency(booking.amount)}</span>
            </div>
            <div className="payment-detail-row">
              <span className="payment-label">Payment Date:</span>
              <span className="payment-value">{booking.payment_date ? formatDate(booking.payment_date) : 'Not available'}</span>
            </div>
            <div className="payment-detail-row">
              <span className="payment-label">Payment Method:</span>
              <span className="payment-value">{booking.method || 'Not available'}</span>
            </div>
            <div className="payment-detail-row">
              <span className="payment-label">Booking ID:</span>
              <span className="payment-value">{booking.booking_id}</span>
            </div>
            <div className="payment-detail-row">
              <span className="payment-label">Ticket ID:</span>
              <span className="payment-value">{booking.ticket_id || 'Not available'}</span>
            </div>
          </div>
          <div className="payment-modal-footer">
            <button className="close-modal-btn-secondary" onClick={closePaymentDetails}>Close</button>
          </div>
        </div>
      </div>
    );
  };

  if (!user) {
    return (
      <div className="travel-history-container">
        <div className="auth-message">Please log in to view your travel history.</div>
      </div>
    );
  }

  // Only allow Passenger and Staff to view travel history
  if (user.role !== 'Passenger' && user.role !== 'Staff') {
    return (
      <div className="travel-history-container">
        <div className="auth-message">Access denied. Only passengers and staff can view travel history.</div>
      </div>
    );
  }

  const title = user.role === 'Staff' ? '🚆 My Staff Travel History' : '🚆 My Travel History';

  return (
    <div className="travel-history-container">
      <h2>{title}</h2>
      
      {loading ? (
        <div className="loading">Loading travel history...</div>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : travelHistory.length === 0 ? (
        <div className="empty-history">
          <p>You haven't made any train journeys yet.</p>
          {user.role === 'Passenger' && (
            <p>Book a train to see your travel history here!</p>
          )}
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
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Actions</th>
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
                    <td className="amount-cell">{booking.amount ? formatCurrency(booking.amount) : 'N/A'}</td>
                    <td>
                      <span className={`status-badge ${booking.status?.toLowerCase() || 'completed'}`}>
                        {booking.status || 'Completed'}
                      </span>
                    </td>
                    <td>
                      <button 
                        className="view-payment-btn"
                        onClick={() => openPaymentDetails(booking)}
                        disabled={!booking.amount}
                        title={booking.amount ? "View payment details" : "No payment information available"}
                      >
                        💳
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Payment Details Modal */}
          {selectedBooking && <PaymentDetailsModal booking={selectedBooking} />}
        </>
      )}
    </div>
  );
};

export default TravelHistory;