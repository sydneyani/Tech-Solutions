import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import ManageRides from './ManageRides'; // ✅ import here
import './AdminPanel.css';

const AdminPanel = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('manage'); // 'manage' or 'passengers'

  const [train, setTrain] = useState({ train_number: '', name: '', route_id: '' });
  const [schedule, setSchedule] = useState({ train_id: '', travel_date: '', departure_time: '', arrival_time: '' });

  const [editTrainData, setEditTrainData] = useState(null);
  const [editScheduleData, setEditScheduleData] = useState(null);

  const [trainList, setTrainList] = useState([]);
  const [routeList, setRouteList] = useState([]);
  const [newRouteName, setNewRouteName] = useState('');

  const fetchData = async () => {
    const trainsRes = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/schedules/trains`);
    const schedulesRes = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/schedules`);

    const trainsWithSchedules = trainsRes.data.map(train => ({
      ...train,
      schedules: schedulesRes.data.filter(s => s.train_name === train.name)
    }));

    setTrainList(trainsWithSchedules);
  };

  useEffect(() => {
    fetchData();
    axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/routes`).then(res => setRouteList(res.data));
  }, []);

  const handleTrainChange = (e) => setTrain({ ...train, [e.target.name]: e.target.value });
  const handleScheduleChange = (e) => setSchedule({ ...schedule, [e.target.name]: e.target.value });

  const submitTrain = async (e) => {
    e.preventDefault();
    await axios.post(`${process.env.REACT_APP_API_BASE_URL}/api/admin/add-train`, train);
    alert('Train added!');
    setTrain({ train_number: '', name: '', route_id: '' });
    fetchData();
  };

  const submitSchedule = async (e) => {
    e.preventDefault();
    await axios.post(`${process.env.REACT_APP_API_BASE_URL}/api/admin/add-schedule`, schedule);
    alert('Schedule added!');
    setSchedule({ train_id: '', travel_date: '', departure_time: '', arrival_time: '' });
    fetchData();
  };

  const removeTrain = async (train_id) => {
    await axios.delete(`${process.env.REACT_APP_API_BASE_URL}/api/admin/delete-train/${train_id}`);
    alert('Train removed!');
    fetchData();
  };

  const removeSchedule = async (schedule_id) => {
    await axios.delete(`${process.env.REACT_APP_API_BASE_URL}/api/admin/delete-schedule/${schedule_id}`);
    alert('Schedule removed!');
    fetchData();
  };

  const createRoute = async () => {
    if (!newRouteName.trim()) return;
    const res = await axios.post(`${process.env.REACT_APP_API_BASE_URL}/api/routes`, { name: newRouteName });
    setRouteList([...routeList, res.data]);
    setNewRouteName('');
  };

  const openTrainEdit = (train) => {
    setEditTrainData({ ...train });
  };

  const openScheduleEdit = (schedule) => {
    setEditScheduleData({
      ...schedule,
      train_id: trainList.find(t => t.name === schedule.train_name)?.train_id || '',
      travel_date: schedule.travel_date.split('T')[0],
    });
  };

  const handleEditTrainChange = (e) => {
    setEditTrainData({ ...editTrainData, [e.target.name]: e.target.value });
  };

  const handleEditScheduleChange = (e) => {
    setEditScheduleData({ ...editScheduleData, [e.target.name]: e.target.value });
  };

  const submitEditTrain = async () => {
    await axios.put(`${process.env.REACT_APP_API_BASE_URL}/api/admin/edit-train/${editTrainData.train_id}`, editTrainData);
    alert('Train updated!');
    setEditTrainData(null);
    fetchData();
  };

  const submitEditSchedule = async () => {
    await axios.put(`${process.env.REACT_APP_API_BASE_URL}/api/admin/edit-schedule/${editScheduleData.schedule_id}`, editScheduleData);
    alert('Schedule updated!');
    setEditScheduleData(null);
    fetchData();
  };

  if (!user || user.role !== 'Admin') {
    return <p style={{ padding: '2rem' }}>You do not have permission to view this page.</p>;
  }

  return (
    <div className="admin-panel">
      <h2>Admin Panel</h2>

      {/* TABS */}
      <div className="tab-header">
        <button className={activeTab === 'manage' ? 'active-tab' : ''} onClick={() => setActiveTab('manage')}>
          Manage Trains/Schedules
        </button>
        <button className={activeTab === 'passengers' ? 'active-tab' : ''} onClick={() => setActiveTab('passengers')}>
          Manage Passengers
        </button>
      </div>

      {/* TAB: MANAGE */}
      {activeTab === 'manage' && (
        <>
          {/* Add New Train */}
          <div className="admin-section">
            <h3>Add New Train</h3>
            <form onSubmit={submitTrain} className="admin-form">
              <input name="train_number" placeholder="Train Number" value={train.train_number} onChange={handleTrainChange} required />
              <input name="name" placeholder="Train Name" value={train.name} onChange={handleTrainChange} required />
              <div className="route-dropdown">
                <select name="route_id" value={train.route_id} onChange={handleTrainChange} required>
                  <option value="">Select Route</option>
                  {routeList.map(r => (
                    <option key={r.route_id} value={r.route_id}>{r.name}</option>
                  ))}
                </select>
                <input type="text" placeholder="New route name" value={newRouteName} onChange={(e) => setNewRouteName(e.target.value)} />
                <button type="button" onClick={createRoute}>➕</button>
              </div>
              <button type="submit">Add Train</button>
            </form>
          </div>

          {/* Add New Schedule */}
          <div className="admin-section">
            <h3>Add New Schedule</h3>
            <form onSubmit={submitSchedule} className="admin-form">
              <select name="train_id" value={schedule.train_id} onChange={handleScheduleChange} required>
                <option value="">Select Train</option>
                {trainList.map(t => (
                  <option key={t.train_id} value={t.train_id}>{t.name}</option>
                ))}
              </select>
              <input type="date" name="travel_date" value={schedule.travel_date} onChange={handleScheduleChange} required />
              <input type="time" name="departure_time" value={schedule.departure_time} onChange={handleScheduleChange} required />
              <input type="time" name="arrival_time" value={schedule.arrival_time} onChange={handleScheduleChange} required />
              <button type="submit">Add Schedule</button>
            </form>
          </div>

          {/* Train List */}
          <div className="admin-section">
            <h3>Remove Train</h3>
            <ul className="train-list">
              {trainList.map(t => (
                <li key={t.train_id}>
                  {t.name} ({t.train_number}) — Route #{t.route_id}
                  <button onClick={() => removeTrain(t.train_id)}>Remove</button>
                  <button className="edit-btn" onClick={() => openTrainEdit(t)}>Edit</button>
                </li>
              ))}
            </ul>
          </div>

          {/* Schedule List */}
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
                          <button onClick={() => removeSchedule(s.schedule_id)}>Remove Schedule</button>
                          <button className="edit-btn" onClick={() => openScheduleEdit(s)}>Edit</button>
                        </li>
                      ))}
                    </ul>
                  ) : <p style={{ color: 'gray', fontStyle: 'italic' }}>N/A</p>}
                </div>
              ))}
            </ul>
          </div>
        </>
      )}

      {/* TAB: MANAGE PASSENGERS */}
      {activeTab === 'passengers' && (
        <div className="admin-section">
          <ManageRides />
        </div>
      )}

      {/* Modals */}
      {editTrainData && (
        <div className="edit-modal">
          <div className="modal-content">
            <h3>Edit Train</h3>
            <input name="train_number" value={editTrainData.train_number} onChange={handleEditTrainChange} />
            <input name="name" value={editTrainData.name} onChange={handleEditTrainChange} />
            <select name="route_id" value={editTrainData.route_id} onChange={handleEditTrainChange}>
              <option value="">Select Route</option>
              {routeList.map(r => (
                <option key={r.route_id} value={r.route_id}>{r.name}</option>
              ))}
            </select>
            <button onClick={submitEditTrain}>Save Changes</button>
            <button className="close-btn" onClick={() => setEditTrainData(null)}>Close</button>
          </div>
        </div>
      )}

      {editScheduleData && (
        <div className="edit-modal">
          <div className="modal-content">
            <h3>Edit Schedule</h3>
            <select name="train_id" value={editScheduleData.train_id} onChange={handleEditScheduleChange}>
              <option value="">Select Train</option>
              {trainList.map(t => (
                <option key={t.train_id} value={t.train_id}>{t.name}</option>
              ))}
            </select>
            <input type="date" name="travel_date" value={editScheduleData.travel_date} onChange={handleEditScheduleChange} />
            <input type="time" name="departure_time" value={editScheduleData.departure_time} onChange={handleEditScheduleChange} />
            <input type="time" name="arrival_time" value={editScheduleData.arrival_time} onChange={handleEditScheduleChange} />
            <button onClick={submitEditSchedule}>Save Changes</button>
            <button className="close-btn" onClick={() => setEditScheduleData(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
