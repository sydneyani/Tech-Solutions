import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './ViewSchedule.css';

const ViewSchedule = () => {
  const [schedules, setSchedules] = useState([]);
  const [filteredSchedules, setFilteredSchedules] = useState([]);
  const [filterValue, setFilterValue] = useState('');

  const fetchSchedules = async () => {
    const res = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/schedules`);
    setSchedules(res.data);
    setFilteredSchedules(res.data);
  };

  useEffect(() => {
    fetchSchedules();
  }, []);

  useEffect(() => {
    if (filterValue.trim() === '') {
      setFilteredSchedules(schedules);
    } else {
      const filtered = schedules.filter(schedule => 
        schedule.train_name.toLowerCase().includes(filterValue.toLowerCase())
      );
      setFilteredSchedules(filtered);
    }
  }, [filterValue, schedules]);

  const formatTime = (timeStr) => {
    const date = new Date(`1970-01-01T${timeStr}Z`);
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleFilterChange = (e) => {
    setFilterValue(e.target.value);
  };

  return (
    <div className="viewschedule-container">
      <h2>🚆 Train Schedules</h2>
      <div className="schedule-controls">
        <button onClick={fetchSchedules} className="refresh-button">
          🔄 Refresh Schedules
        </button>
        <div className="filter-container">
          <input
            type="text"
            placeholder="Filter by train name..."
            value={filterValue}
            onChange={handleFilterChange}
            className="filter-input"
          />
          {filterValue && (
            <button 
              className="clear-filter" 
              onClick={() => setFilterValue('')}
              title="Clear filter"
            >
              ✕
            </button>
          )}
        </div>
      </div>
      
      {filteredSchedules.length === 0 ? (
        <p>No schedules found</p>
      ) : (
        <ul>
          {filteredSchedules.map((s) => (
            <li key={s.schedule_id}>
              <div className="train-name">{s.train_name}</div>
              <div className="schedule-date">📅 {formatDate(s.travel_date)}</div>
              <div className="time-row">
                <span className="time-depart">🕑 Departs: {formatTime(s.departure_time)}</span>
                <span className="time-arrive">🛬 Arrives: {formatTime(s.arrival_time)}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ViewSchedule;
