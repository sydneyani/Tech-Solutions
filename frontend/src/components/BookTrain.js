import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Payments from './Payments';
import './BookTrain.css';

const BookTrain = () => {
  const [schedules, setSchedules] = useState([]);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [selectedScheduleData, setSelectedScheduleData] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [seats, setSeats] = useState([]);
  const [showSeatModal, setShowSeatModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [ticket, setTicket] = useState(null);
  const [totalFare, setTotalFare] = useState(0);

  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is logged in and has appropriate role
    if (user && user.role !== 'Passenger' && user.role !== 'Staff' && user.role !== 'Admin') {
      navigate('/dashboard');
      return;
    }
    
    const fetchSchedules = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/schedules`);
        setSchedules(res.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching schedules:', err);
        setError('Failed to load train schedules');
        setLoading(false);
      }
    };
    fetchSchedules();
  }, [user, navigate]);

  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    const date = new Date(`1970-01-01T${timeStr}Z`);
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };
  
  // Helper function to properly format the issued date
  const formatIssuedDate = (dateStr) => {
    try {
      if (!dateStr) return 'Not available';
      
      // Try to parse the date
      const date = new Date(dateStr);
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        console.log('Invalid date format:', dateStr);
        return new Date().toLocaleString(); // Fallback to current date
      }
      
      // Return formatted date
      return date.toLocaleString();
    } catch (error) {
      console.error('Error formatting issued date:', error);
      return new Date().toLocaleString(); // Fallback to current date
    }
  };

  const bookSeat = async (schedule) => {
    try {
      setLoading(true);
      setError(null);
      
      const res = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/schedules/seats/${schedule.schedule_id}`);
      setSelectedSchedule(schedule.schedule_id);
      setSelectedScheduleData(schedule);
      setSeats(res.data);
      setSelectedSeats([]); // Reset selected seats when opening modal
      setShowSeatModal(true);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching seats:', err);
      setError('Failed to load seats');
      setLoading(false);
    }
  };

  const handleSeatClick = (seat) => {
    // Check if seat is already selected
    if (selectedSeats.some(s => s.seat_id === seat.seat_id)) {
      // Remove seat from selection
      setSelectedSeats(selectedSeats.filter(s => s.seat_id !== seat.seat_id));
    } else {
      // Add seat to selection
      setSelectedSeats([...selectedSeats, seat]);
    }
    
    // Calculate total fare (assuming each seat costs ₹1500)
    const seatPrice = 1500;
    setTotalFare((selectedSeats.length + 1) * seatPrice);
  };

  const handleProceedToPayment = () => {
    if (selectedSeats.length === 0) {
      setError('Please select at least one seat');
      return;
    }
    
    // Calculate final fare
    const seatPrice = 1500;
    setTotalFare(selectedSeats.length * seatPrice);
    
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = (ticketData) => {
    console.log('Payment success, ticket data:', ticketData);
    setTicket(ticketData);
    setShowPaymentModal(false);
    setShowSeatModal(false);
    // Show ticket confirmation
  };

  const handlePaymentCancel = () => {
    setShowPaymentModal(false);
  };

  const handleBookingComplete = () => {
    // Reset states and navigate user back
    setTicket(null);
    setSelectedSeats([]);
    setSelectedSchedule(null);
    setSelectedScheduleData(null);
    
    // Refresh schedules to show updated seat availability
    const fetchSchedules = async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/schedules`);
        setSchedules(res.data);
      } catch (err) {
        console.error('Error fetching schedules:', err);
      }
    };
    fetchSchedules();
  };

  // If user not logged in or not a passenger/staff/admin, don't show the component
  if (!user || (user.role !== 'Passenger' && user.role !== 'Staff' && user.role !== 'Admin')) {
    return <div className="booktrain-container">
      <div className="auth-message">You don't have permission to access this page.</div>
    </div>;
  }

  return (
    <div className="booktrain-container">
      <h2>🚆 Available Trains</h2>
      
      {error && <div className="error-message">{error}</div>}
      
      {loading ? (
        <p>Loading trains...</p>
      ) : schedules.length === 0 ? (
        <p>No schedules found</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Train</th>
              <th>Date</th>
              <th>Departure</th>
              <th>Arrival</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {schedules.map((schedule) => (
              <tr key={schedule.schedule_id}>
                <td>
                  <span className="train-label">{schedule.train_name}</span>
                  {user?.role === 'Admin' && (
                    <span
                      className="gear-icon"
                      onClick={() => navigate('/admin')}
                      title="Manage Train"
                    >
                      ⚙️
                    </span>
                  )}
                </td>
                <td>{formatDate(schedule.travel_date)}</td>
                <td>{formatTime(schedule.departure_time)}</td>
                <td>{formatTime(schedule.arrival_time)}</td>
                <td>
                  <button 
                    onClick={() => bookSeat(schedule)}
                    disabled={loading}
                  >
                    Book
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Seat Selection Modal */}
      {showSeatModal && (
        <div className="seat-modal">
          <div className="modal-content">
            <h3>Select Seats</h3>
            {loading ? (
              <p>Loading seats...</p>
            ) : (
              <>
                <div className="train-info">
                  <p><strong>{selectedScheduleData?.train_name}</strong></p>
                  <p>{formatDate(selectedScheduleData?.travel_date)} • {formatTime(selectedScheduleData?.departure_time)} to {formatTime(selectedScheduleData?.arrival_time)}</p>
                </div>
                
                <div className="selected-seats-summary">
                  <p>Selected Seats: {selectedSeats.length > 0 ? 
                    selectedSeats.map(seat => seat.seat_number).join(', ') : 
                    'None'}</p>
                  <p>Total Fare: ₹{selectedSeats.length * 1500}</p>
                </div>
                
                <div className="train-outline">
                  <div className="seats-grid">
                    {seats.map(seat => (
                      <button
                        key={seat.seat_id}
                        className={`seat-btn 
                          ${seat.is_booked ? 'taken' : ''} 
                          ${selectedSeats.some(s => s.seat_id === seat.seat_id) ? 'selected' : ''}`}
                        onClick={() => !seat.is_booked && handleSeatClick(seat)}
                        disabled={seat.is_booked}
                      >
                        {seat.seat_number}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="seat-legend">
                  <div className="legend-item">
                    <div className="legend-color available"></div>
                    <span>Available</span>
                  </div>
                  <div className="legend-item">
                    <div className="legend-color selected"></div>
                    <span>Selected</span>
                  </div>
                  <div className="legend-item">
                    <div className="legend-color taken"></div>
                    <span>Booked</span>
                  </div>
                </div>
                
                <div className="modal-actions">
                  <button 
                    className="proceed-btn" 
                    onClick={handleProceedToPayment}
                    disabled={selectedSeats.length === 0}
                  >
                    Proceed to Payment
                  </button>
                  <button className="close-btn" onClick={() => setShowSeatModal(false)}>Cancel</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <Payments
          seats={selectedSeats}
          schedule={selectedScheduleData}
          user={user}
          selectedSchedule={selectedSchedule}
          totalFare={totalFare}
          onSuccess={handlePaymentSuccess}
          onCancel={handlePaymentCancel}
        />
      )}

      {/* Ticket Confirmation Modal */}
      {ticket && (
        <div className="seat-modal">
          <div className="modal-content ticket-confirmation">
            <h3>🎫 Ticket Confirmed!</h3>
            <div className="ticket-details">
              <p><strong>Ticket ID:</strong> {ticket.ticket_id}</p>
              <p><strong>Train:</strong> {ticket.train_name || selectedScheduleData?.train_name}</p>
              <p><strong>Date:</strong> {formatDate(ticket.travel_date || selectedScheduleData?.travel_date)}</p>
              <p><strong>Time:</strong> {formatTime(ticket.departure_time || selectedScheduleData?.departure_time)} to {formatTime(ticket.arrival_time || selectedScheduleData?.arrival_time)}</p>
              <p><strong>Seats:</strong> {ticket.seat_numbers || selectedSeats.map(seat => seat.seat_number).join(', ')}</p>
              <p><strong>Passenger:</strong> {ticket.passenger_name || `${user?.first_name} ${user?.last_name}`}</p>
              <p><strong>Issued:</strong> {formatIssuedDate(ticket.issued_date)}</p>
              <p><strong>Total Fare:</strong> ₹{ticket.total_fare || totalFare}</p>
            </div>
            <div className="ticket-actions">
              <button onClick={handleBookingComplete}>Done</button>
              {/* You could add a "Print Ticket" button here */}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookTrain;
