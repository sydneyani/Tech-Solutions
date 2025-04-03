const express = require('express');
const router = express.Router();
const db = require('../db');

// New endpoint that includes all necessary passenger details directly
router.get('/rides-with-passengers', (req, res) => {
    const query = `
      SELECT 
        s.schedule_id,
        s.travel_date,
        s.departure_time,
        s.arrival_time,
        t.name AS train_name,
        b.booking_id,
        u.user_id,
        u.first_name, 
        u.last_name,
        CONCAT(u.first_name, ' ', u.last_name) AS passenger_name,
        u.email,
        u.mobile,
        u.gender,
        bd.age,
        seats.seat_number,
        seats.class_type
      FROM bookings b
      JOIN booking_details bd ON bd.booking_id = b.booking_id
      JOIN seats ON bd.seat_id = seats.seat_id
      JOIN schedules s ON b.schedule_id = s.schedule_id
      JOIN trains t ON s.train_id = t.train_id
      JOIN users u ON b.user_id = u.user_id
      WHERE seats.is_booked = 1
      ORDER BY s.travel_date ASC, s.schedule_id;
    `;
  
    db.query(query, (err, results) => {
      if (err) {
        console.error('Error fetching rides with passengers:', err);
        return res.status(500).json({ error: 'Failed to fetch rides' });
      }
  
      // Group results by schedule
      const grouped = {};
      results.forEach(row => {
        if (!grouped[row.schedule_id]) {
          grouped[row.schedule_id] = {
            schedule_id: row.schedule_id,
            train_name: row.train_name,
            travel_date: row.travel_date,
            departure_time: row.departure_time,
            arrival_time: row.arrival_time,
            passengers: []
          };
        }
  
        // Include all passenger data directly in the response
        grouped[row.schedule_id].passengers.push({
          user_id: row.user_id,
          passenger_name: row.passenger_name,
          first_name: row.first_name,
          last_name: row.last_name,
          email: row.email,
          mobile: row.mobile,
          gender: row.gender,
          age: row.age,
          seat_number: row.seat_number,
          class_type: row.class_type
        });
      });
  
      res.json(Object.values(grouped));
    });
  });

// Get passenger details by username
router.get('/passenger-details/:passenger_name', (req, res) => {
    const { username } = req.params;
  
    const query = `
      SELECT 
        u.first_name,
        u.last_name,
        u.username,
        u.gender,
        u.dob,
        u.email,
        u.mobile,
        TIMESTAMPDIFF(YEAR, u.dob, CURDATE()) AS age
      FROM users u
      JOIN passenger p ON u.user_id = p.passenger_id
      WHERE u.username = ?
    `;
  
    db.query(query, [username], (err, results) => {
      if (err) {
        console.error('Error fetching passenger:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      if (results.length === 0) {
        return res.status(404).json({ error: 'Passenger not found' });
      }
      res.status(200).json(results[0]);
    });
  });
  
  router.get('/passenger-details/:username', (req, res) => {
    const { username } = req.params;
  
    const query = `
      SELECT 
        first_name, last_name, gender, dob, email, mobile,
        TIMESTAMPDIFF(YEAR, dob, CURDATE()) AS age
      FROM users
      WHERE username = ?
    `;
  
    db.query(query, [username], (err, results) => {
      if (err) {
        console.error('Error fetching user details:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      if (results.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.status(200).json(results[0]);
    });
  });
  
// Add this to your staffRoutes.js file
// Update the rides-with-passengers endpoint to include seat_id

router.get('/rides-with-passengers', (req, res) => {
    const query = `
      SELECT 
        s.schedule_id,
        s.travel_date,
        s.departure_time,
        s.arrival_time,
        t.name AS train_name,
        t.train_id,
        b.booking_id,
        b.user_id,
        u.first_name, 
        u.last_name,
        CONCAT(u.first_name, ' ', IFNULL(u.last_name, '')) AS passenger_name,
        u.email,
        u.mobile,
        u.gender,
        bd.booking_detail_id,
        bd.age,
        bd.passenger_name AS booked_passenger_name,
        seats.seat_id,
        seats.seat_number,
        seats.class_type
      FROM seats
      JOIN booking_details bd ON seats.seat_id = bd.seat_id
      JOIN bookings b ON bd.booking_id = b.booking_id
      JOIN schedules s ON b.schedule_id = s.schedule_id
      JOIN trains t ON s.train_id = t.train_id
      JOIN users u ON b.user_id = u.user_id
      WHERE seats.is_booked = 1
      ORDER BY s.travel_date ASC, s.schedule_id
    `;
  
    db.query(query, (err, results) => {
      if (err) {
        console.error('Error fetching rides with passengers:', err);
        return res.status(500).json({ error: 'Failed to fetch rides: ' + err.message });
      }
  
      console.log(`Retrieved ${results.length} passenger records`);
      
      // Debug: Check sample data
      if (results.length > 0) {
        const sample = results[0];
        console.log('Sample raw result row:', {
          schedule_id: sample.schedule_id,
          seat_number: sample.seat_number,
          passenger_name: sample.passenger_name
        });
      }
  
      // Group results by schedule
      const grouped = {};
      results.forEach(row => {
        if (!grouped[row.schedule_id]) {
          grouped[row.schedule_id] = {
            schedule_id: row.schedule_id,
            train_id: row.train_id,
            train_name: row.train_name,
            travel_date: row.travel_date,
            departure_time: row.departure_time,
            arrival_time: row.arrival_time,
            passengers: []
          };
        }
  
        // Include both schedule_id and seat_number for each passenger
        const passenger = {
          schedule_id: row.schedule_id,
          seat_number: row.seat_number,
          booking_id: row.booking_id,
          booking_detail_id: row.booking_detail_id,
          user_id: row.user_id,
          passenger_name: row.booked_passenger_name || row.passenger_name,
          first_name: row.first_name,
          last_name: row.last_name,
          email: row.email,
          mobile: row.mobile,
          gender: row.gender,
          age: row.age,
          class_type: row.class_type
        };
        
        grouped[row.schedule_id].passengers.push(passenger);
      });
  
      // Final verification
      const response = Object.values(grouped);
      if (response.length > 0 && response[0].passengers.length > 0) {
        const firstPassenger = response[0].passengers[0];
        console.log('First passenger in processed response:', {
          schedule_id: firstPassenger.schedule_id,
          seat_number: firstPassenger.seat_number,
          name: firstPassenger.passenger_name
        });
      }
  
      res.json(response);
    });
  });

module.exports = router;
