import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import './AdminPanel.css';

const AdminPanel = () => {
  const { user } = useAuth();
  const [train, setTrain] = useState({ train_number: '', name: '', route_id: '' });
  const [schedule, setSchedule] = useState({ train_id: '', travel_date: '', departure_time: '', arrival_time: '' });
  const [trainList, setTrainList] = useState([]);
  const [routeList, setRouteList] = useState([]);
  const [newRouteName, setNewRouteName] = useState([]);

  const fetchData = async () => {
    const trainsRes = await axios.get('http://localhost:5000/api/schedules/trains');
    const schedulesRes = await axios.get('http://localhost:5000/api/schedules');

    const trainsWithSchedules = trainsRes.data.map(train => ({
      ...train,
      schedules: schedulesRes.data.filter(s => s.train_name === train.name)
    }));

    setTrainList(trainsWithSchedules);
  };

  useEffect(() => {
    fetchData();
    axios.get('http://localhost:5000/api/routes').then(res => setRouteList(res.data));
  }, []);

  const handleTrainChange = (e) => setTrain({ ...train, [e.target.name]: e.target.value });
  const handleScheduleChange = (e) => setSchedule({ ...schedule, [e.target.name]: e.target.value });

  const submitTrain = async (e) => {
    e.preventDefault();
    await axios.post('http://localhost:5000/api/admin/add-train', train);
    alert('Train added successfully!');
    fetchData();
  };

  const submitSchedule = async (e) => {
    e.preventDefault();
    await axios.post('http://localhost:5000/api/admin/add-schedule', schedule);
    alert('Schedule added successfully!');
    fetchData();
  };

  const removeTrain = async (train_id) => {
    await axios.delete(`http://localhost:5000/api/admin/delete-train/${train_id}`);
    alert('Train removed!');
    fetchData();
  };

  const removeSchedule = async (schedule_id) => {
    await axios.delete(`http://localhost:5000/api/admin/delete-schedule/${schedule_id}`);
    alert('Schedule removed!');
    fetchData();
  };

  const createRoute = async () => {
    if (!newRouteName.trim()) return;
    const res = await axios.post('http://localhost:5000/api/routes', { name: newRouteName });
    setRouteList([...routeList, res.data]);
    setNewRouteName('');
  };

  if (!user || user.role !== 'Admin') {
    return <p style={{ padding: '2rem' }}>You do not have permission to view this page.</p>;
  }

  return (
    <div className="admin-panel">
      <h2>Admin Panel</h2>

      {/* Add Train */}
      <div className="admin-section">
        <h3>Add New Train</h3>
        <form onSubmit={submitTrain} className="admin-form">
          <input name="train_number" placeholder="Train Number" onChange={handleTrainChange} required />
          <input name="name" placeholder="Train Name" onChange={handleTrainChange} required />
          <div className="route-dropdown">
            <select name="route_id" onChange={handleTrainChange} required>
              <option value="">Select Route</option>
              {routeList.map(r => (
                <option key={r.route_id} value={r.route_id}>{r.name}</option>
              ))}
            </select>
            <input
              type="text"
              placeholder="New route name"
              value={newRouteName}
              onChange={(e) => setNewRouteName(e.target.value)}
            />
            <button type="button" onClick={createRoute}>➕</button>
          </div>
          <button type="submit">Add Train</button>
        </form>
      </div>

      {/* Add Schedule */}
      <div className="admin-section">
        <h3>Add New Schedule</h3>
        <form onSubmit={submitSchedule} className="admin-form">
          <select name="train_id" onChange={handleScheduleChange} required>
            <option value="">Select Train</option>
            {trainList.map(t => (
              <option key={t.train_id} value={t.train_id}>{t.name}</option>
            ))}
          </select>
          <label htmlFor="travel_date">Travel Date</label>
<input
  type="date"
  name="travel_date"
  id="travel_date"
  onChange={handleScheduleChange}
  required
/>

<label htmlFor="departure_time">Departure Time</label>
<input
  type="time"
  name="departure_time"
  id="departure_time"
  onChange={handleScheduleChange}
  required
/>

<label htmlFor="arrival_time">Arrival Time</label>
<input
  type="time"
  name="arrival_time"
  id="arrival_time"
  onChange={handleScheduleChange}
  required
/>
          <button type="submit">Add Schedule</button>
        </form>
      </div>

      {/* Remove Train */}
      <div className="admin-section">
        <h3>Remove Train</h3>
        <ul className="train-list">
          {trainList.map(t => (
            <li key={t.train_id}>
              {t.name} ({t.train_number}) — Route #{t.route_id}
              <button onClick={() => removeTrain(t.train_id)}>Remove</button>
            </li>
          ))}
        </ul>
      </div>

      {/* Remove Schedule */}
      <div className="admin-section">
        <h3>Remove Schedule</h3>
        <ul className="train-list">
          {trainList.map(train => (
            <div key={train.train_id}>
              <strong>{train.name} ({train.train_number})</strong>
              {train.schedules?.length > 0 ? (
                <ul>
                  {train.schedules.map(s => (
                    <li key={s.schedule_id}>
                      {s.travel_date} — {s.departure_time} ➝ {s.arrival_time}
                      <button onClick={() => removeSchedule(s.schedule_id)} style={{ marginLeft: '1rem' }}>
                        Remove Schedule
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p style={{ color: 'gray', fontStyle: 'italic', marginLeft: '1rem' }}>N/A</p>
              )}
            </div>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default AdminPanel;
