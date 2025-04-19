import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './ManageRides.css';

const ManageRides = () => {
  const [schedules, setSchedules] = useState([]);
  const [selectedPassenger, setSelectedPassenger] = useState(null);
  const [selectedScheduleId, setSelectedScheduleId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [removing, setRemoving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const fetchRides = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const res = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/staff/rides-with-passengers`);
      console.log('Rides data:', res.data);
      setSchedules(res.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching rides:', err);
      setError('Failed to load ride data: ' + (err.response?.data?.error || err.message));
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRides();
  }, []);

  const viewPassenger = (passenger, schedule_id) => {
    console.log('Viewing passenger:', passenger, 'from schedule:', schedule_id);
    setSelectedPassenger(passenger);
    setSelectedScheduleId(schedule_id);
  };

  const closeModal = () => {
    setSelectedPassenger(null);
    setSelectedScheduleId(null);
    setError(null);
    setConfirmDelete(null);
  };

  const confirmRemovePassenger = (passenger, schedule_id, e) => {
    if (e) {
      e.stopPropagation(); // Prevent triggering the view passenger action
    }
    console.log('Confirming removal for passenger:', passenger, 'from schedule:', schedule_id);
    setConfirmDelete({ passenger, schedule_id });
  };

  const removeButtonClick = (passenger, schedule_id, e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Remove button clicked for passenger:', passenger, 'from schedule:', schedule_id);
    confirmRemovePassenger(passenger, schedule_id);
    return false;
  };

  const removePassenger = async () => {
    if (!confirmDelete || !confirmDelete.passenger || !confirmDelete.schedule_id) {
      setError("Cannot remove passenger: Missing passenger or schedule data");
      return;
    }
    
    const { passenger, schedule_id } = confirmDelete;
    
    if (!passenger.seat_number) {
      console.error('Missing seat_number in passenger object:', passenger);
      setError(`Cannot remove passenger: Missing seat information for ${passenger.passenger_name}`);
      return;
    }
    
    const seat_number = passenger.seat_number;
    
    try {
      setRemoving(true);
      setError(null);
      
      console.log(`Attempting to remove passenger from schedule ${schedule_id}, seat ${seat_number}`);
      
      // Using the new endpoint that works with schedule_id and seat_number from context
      const response = await axios.delete(
        `${process.env.REACT_APP_API_BASE_URL}/api/admin/remove-passenger/schedule/${schedule_id}/seat/${seat_number}`
      );
      
      console.log('Remove response:', response.data);
      
      // Refresh the ride data after removal
      await fetchRides();
      
      setRemoving(false);
      setConfirmDelete(null);
      
      // Show success message
      alert('Passenger has been removed from the seat successfully');
    } catch (err) {
      console.error('Error removing passenger:', err);
      setError(`Failed to remove passenger: ${err.response?.data?.error || err.message}`);
      setRemoving(false);
    }
  };

  return (
    <div className="managerides-container">
      <h2>🧾 Manage Rides</h2>
      
      {loading && <p>Loading ride data...</p>}
      
      {error && <div className="error-message">{error}</div>}
      
      {!loading && schedules.length === 0 ? (
        <p>No ride data available</p>
      ) : (
        schedules.map(schedule => (
          <div key={schedule.schedule_id} className="schedule-box">
            <h4>{schedule.train_name} — {new Date(schedule.travel_date).toLocaleDateString()}</h4>
            <p>⏰ {schedule.departure_time} ➝ {schedule.arrival_time}</p>

            <div className="manage-layout">
              <ul className="passenger-list">
                {schedule.passengers.length > 0 ? (
                  schedule.passengers.map((passenger, index) => (
                    <li 
                      key={index} 
                      onClick={() => viewPassenger(passenger, schedule.schedule_id)} 
                      className="passenger-click"
                    >
                      <div>
                        {passenger.passenger_name} (Seat {passenger.seat_number}) — {passenger.class_type || 'AC'}
                      </div>
                      <button 
                        type="button"
                        className="remove-btn"
                        onClick={(e) => removeButtonClick(passenger, schedule.schedule_id, e)}
                        style={{
                          backgroundColor: '#ff4d4f',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '4px 8px',
                          fontSize: '12px',
                          cursor: 'pointer',
                          marginLeft: '8px',
                          zIndex: 10,
                          position: 'relative'
                        }}
                      >
                        Remove
                      </button>
                    </li>
                  ))
                ) : <p>No passengers</p>}
              </ul>

              <div className="train-outline staff-layout">
                <div className="seats-grid">
                  {[...Array(30)].map((_, i) => {
                    const seatNum = i < 15 ? `A${i + 1}` : `S${i - 14}`;
                    const isBooked = schedule.passengers.some(p => p.seat_number === seatNum);
                    return (
                      <button
                        key={seatNum}
                        className={`seat-btn ${isBooked ? 'taken' : ''}`}
                        disabled
                      >
                        {seatNum}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        ))
      )}

      {/* Passenger Details Modal */}
      {selectedPassenger && (
        <div className="edit-modal">
          <div className="modal-content">
            <h3>Passenger Info</h3>
            <p><strong>Name:</strong> {selectedPassenger.passenger_name}</p>
            <p><strong>Seat:</strong> {selectedPassenger.seat_number} ({selectedPassenger.class_type || 'AC'})</p>
            <p><strong>Schedule ID:</strong> {selectedScheduleId}</p>
            <p><strong>User ID:</strong> {selectedPassenger.user_id}</p>
            <p><strong>Gender:</strong> {selectedPassenger.gender || 'Not specified'}</p>
            <p><strong>Age:</strong> {selectedPassenger.age || 'Not specified'}</p>
            <p><strong>Email:</strong> {selectedPassenger.email || 'Not specified'}</p>
            <p><strong>Mobile:</strong> {selectedPassenger.mobile || 'Not specified'}</p>
            <div className="modal-actions">
              <button onClick={closeModal}>Close</button>
              <button 
                className="remove-btn"
                onClick={() => confirmRemovePassenger(selectedPassenger, selectedScheduleId)}
                style={{
                  backgroundColor: '#ff4d4f',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '8px 16px'
                }}
              >
                Remove Passenger
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmDelete && (
        <div className="edit-modal">
          <div className="modal-content">
            <h3>Confirm Removal</h3>
            <p>Are you sure you want to remove the following passenger?</p>
            <p><strong>{confirmDelete.passenger.passenger_name}</strong> from seat <strong>{confirmDelete.passenger.seat_number}</strong></p>
            <p><strong>Train Schedule ID:</strong> {confirmDelete.schedule_id}</p>
            <p className="warning">This action cannot be undone!</p>
            <div className="modal-actions">
              <button onClick={closeModal}>Cancel</button>
              <button 
                className="remove-btn"
                onClick={removePassenger}
                disabled={removing}
                style={{
                  backgroundColor: '#ff4d4f',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '8px 16px'
                }}
              >
                {removing ? 'Removing...' : 'Yes, Remove Passenger'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageRides;