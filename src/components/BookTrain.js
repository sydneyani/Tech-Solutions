import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './BookTrain.css';

const BookTrain = () => {
  const [schedules, setSchedules] = useState([]);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [seats, setSeats] = useState([]);
  const [showModal, setShowModal] = useState(false);

  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSchedules = async () => {
      const res = await axios.get('http://localhost:5000/api/schedules');
      setSchedules(res.data);
    };
    fetchSchedules();
  }, []);

  const formatTime = (timeStr) => {
    const date = new Date(`1970-01-01T${timeStr}Z`);
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const bookSeat = async (schedule_id) => {
    const res = await axios.get(`http://localhost:5000/api/schedules/seats/${schedule_id}`);
    setSelectedSchedule(schedule_id);
    setSeats(res.data);
    setShowModal(true);
  };

  const handleSeatClick = async (seat_id) => {
    await axios.post(`http://localhost:5000/api/schedules/seats/book`, {
      seat_id,
      user_id: user.user_id,         // From useAuth context
      schedule_id: selectedSchedule  // From your modal
    });
    alert(`Seat booked successfully!`);
    setShowModal(false);
  };
  

  return (
    <div className="booktrain-container">
      <h2>🚆 Available Trains</h2>
      {schedules.length === 0 ? (
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
            {schedules.map((s) => (
              <tr key={s.schedule_id}>
                <td>
                  <span className="train-label">{s.train_name}</span>
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
                <td>{formatDate(s.travel_date)}</td>
                <td>{formatTime(s.departure_time)}</td>
                <td>{formatTime(s.arrival_time)}</td>
                <td>
                  <button onClick={() => bookSeat(s.schedule_id)}>Book</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {showModal && (
        <div className="seat-modal">
          <div className="modal-content">
            <h3>Select a Seat</h3>
            <div className="train-outline">
              <div className="seats-grid">
                {seats.map(seat => (
                  <button
                    key={seat.seat_id}
                    className={`seat-btn ${seat.is_booked ? 'taken' : ''}`}
                    onClick={() => !seat.is_booked && handleSeatClick(seat.seat_id)}
                    disabled={seat.is_booked}
                  >
                    {seat.seat_number}
                  </button>
                ))}
              </div>
            </div>
            <button className="close-btn" onClick={() => setShowModal(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookTrain;
