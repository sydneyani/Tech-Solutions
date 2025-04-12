const express = require('express');
const router = express.Router();
const db = require('../db');

// Register User + add to passenger table (default role is 'Passenger')
router.post('/register', (req, res) => {
    const {
      first_name,
      last_name,
      username,
      email,
      password,
      gender,
      dob,
      mobile,
      // Get role from request or default to 'Passenger'
      role = 'Passenger'
    } = req.body;
  
    console.log('Received registration:', req.body);
    console.log('Using role:', role); // Log the role being used
  
    const insertUserQuery = `
      INSERT INTO users (first_name, last_name, username, email, password, gender, dob, mobile, role)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
  
    db.query(insertUserQuery, [first_name, last_name, username, email, password, gender, dob, mobile, role], (err, result) => {
      if (err) {
        console.error('Error creating user:', err);
        return res.status(500).json({ error: 'Failed to register user' });
      }
  
      const userId = result.insertId;
      console.log('User inserted with ID:', userId);
  
      // Since default role is 'Passenger', this will almost always execute
      if (role === 'Passenger') {
        console.log('User is a Passenger - inserting into passenger table');
  
        const insertPassengerQuery = `INSERT INTO passenger (passenger_id) VALUES (?)`;
        db.query(insertPassengerQuery, [userId], (passengerErr) => {
          if (passengerErr) {
            console.error('❌ Error inserting into passenger table:', passengerErr);
            return res.status(500).json({ error: 'User created but passenger profile failed' });
          }
  
          console.log('✅ Passenger inserted successfully');
          return res.status(201).json({ 
            message: 'Passenger user registered successfully',
            user: {
              user_id: userId,
              first_name,
              last_name,
              username,
              email,
              gender,
              dob, 
              mobile,
              role
            }
          });
        });
      } else {
        return res.status(201).json({ 
          message: 'User registered successfully',
          user: {
            user_id: userId,
            first_name,
            last_name,
            username,
            email,
            gender,
            dob, 
            mobile,
            role
          }
        });
      }
    });
  });

// Login User
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  const query = `SELECT * FROM users WHERE username = ? AND password = ?`;

  db.query(query, [username, password], (err, results) => {
    if (err) {
      console.error('Login query error:', err);
      return res.status(500).json({ error: 'Server error during login' });
    }

    if (results.length === 0) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const user = results[0];
    res.status(200).json({ user });
  });
});

// Get ticket by booking ID
router.get('/booking/:booking_id', (req, res) => {
  const { booking_id } = req.params;
  
  const query = `
    SELECT 
      t.ticket_id, 
      t.ticket_number, 
      t.issued_date,
      b.booking_id,
      s.travel_date,
      s.departure_time,
      s.arrival_time,
      tr.name AS train_name,
      tr.train_number,
      r.name AS route_name,
      bd.passenger_name,
      st.seat_number,
      st.class_type,
      u.first_name,
      u.last_name,
      u.email,
      p.amount,
      p.method AS payment_method,
      p.status AS payment_status
    FROM tickets t
    JOIN bookings b ON t.booking_id = b.booking_id
    JOIN schedules s ON b.schedule_id = s.schedule_id
    JOIN trains tr ON s.train_id = tr.train_id
    JOIN routes r ON tr.route_id = r.route_id
    JOIN booking_details bd ON b.booking_id = bd.booking_id
    JOIN seats st ON bd.seat_id = st.seat_id
    JOIN users u ON b.user_id = u.user_id
    LEFT JOIN payments p ON b.booking_id = p.booking_id
    WHERE b.booking_id = ?
  `;
  
  db.query(query, [booking_id], (err, results) => {
    if (err) {
      console.error('Error fetching ticket by booking ID:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (results.length === 0) {
      return res.status(404).json({ error: 'Ticket not found for this booking' });
    }
    
    res.status(200).json(results[0]);
  });
});

module.exports = router;