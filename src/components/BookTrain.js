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
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [seats, setSeats] = useState([]);
  const [showSeatModal, setShowSeatModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [ticket, setTicket] = useState(null);

  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSchedules = async () => {
      try {
        setLoading(true);
        const res = await axios.get('http://localhost:5000/api/schedules');
        setSchedules(res.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching schedules:', err);
        setError('Failed to load train schedules');
        setLoading(false);
      }
    };
    fetchSchedules();
  }, []);

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

  const bookSeat = async (schedule) => {
    try {
      setLoading(true);
      setError(null);
      
      const res = await axios.get(`http://localhost:5000/api/schedules/seats/${schedule.schedule_id}`);
      setSelectedSchedule(schedule.schedule_id);
      setSelectedScheduleData(schedule);
      setSeats(res.data);
      setShowSeatModal(true);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching seats:', err);
      setError('Failed to load seats');
      setLoading(false);
    }
  };

  const handleSeatClick = (seat) => {
    // Instead of immediately booking, store the selected seat and show payment modal
    setSelectedSeat(seat);
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = (ticketData) => {
    setTicket(ticketData);
    setShowPaymentModal(false);
    setShowSeatModal(false);
    // Show ticket confirmation
  };

  const handlePaymentCancel = () => {
    setShowPaymentModal(false);
    setSelectedSeat(null);
  };

  const handleBookingComplete = () => {
    // Reset states and navigate user back
    setTicket(null);
    setSelectedSeat(null);
    setSelectedSchedule(null);
    setSelectedScheduleData(null);
    
    // Refresh schedules to show updated seat availability
    const fetchSchedules = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/schedules');
        setSchedules(res.data);
      } catch (err) {
        console.error('Error fetching schedules:', err);
      }
    };
    fetchSchedules();
  };

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
            <h3>Select a Seat</h3>
            {loading ? (
              <p>Loading seats...</p>
            ) : (
              <>
                <div className="train-info">
                  <p><strong>{selectedScheduleData?.train_name}</strong></p>
                  <p>{formatDate(selectedScheduleData?.travel_date)} • {formatTime(selectedScheduleData?.departure_time)} to {formatTime(selectedScheduleData?.arrival_time)}</p>
                </div>
                <div className="train-outline">
                  <div className="seats-grid">
                    {seats.map(seat => (
                      <button
                        key={seat.seat_id}
                        className={`seat-btn ${seat.is_booked ? 'taken' : ''}`}
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
                    <div className="legend-color taken"></div>
                    <span>Booked</span>
                  </div>
                </div>
              </>
            )}
            <button className="close-btn" onClick={() => setShowSeatModal(false)}>Close</button>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <Payments
          seat={selectedSeat}
          schedule={selectedScheduleData}
          user={user}
          selectedSchedule={selectedSchedule}
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
              <p><strong>Train:</strong> {selectedScheduleData?.train_name}</p>
              <p><strong>Date:</strong> {formatDate(selectedScheduleData?.travel_date)}</p>
              <p><strong>Time:</strong> {formatTime(selectedScheduleData?.departure_time)} to {formatTime(selectedScheduleData?.arrival_time)}</p>
              <p><strong>Seat:</strong> {selectedSeat?.seat_number}</p>
              <p><strong>Passenger:</strong> {user?.first_name} {user?.last_name}</p>
              <p><strong>Issued:</strong> {new Date(ticket.issued_date).toLocaleString()}</p>
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