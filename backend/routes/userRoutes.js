const express = require('express');
const router = express.Router();
const db = require('../db');

// Register User + add to passenger table if role = 'Passenger'
// Register User + add to passenger table if role = 'Passenger'
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
      role
    } = req.body;
  
    console.log('Received registration:', req.body);
  
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
  
      if (role === 'Passenger') {
        console.log('User is a Passenger - inserting into passenger table');
  
        const insertPassengerQuery = `INSERT INTO passenger (passenger_id) VALUES (?)`;
        db.query(insertPassengerQuery, [userId], (passengerErr) => {
          if (passengerErr) {
            console.error('❌ Error inserting into passenger table:', passengerErr);
            return res.status(500).json({ error: 'User created but passenger profile failed' });
          }
  
          console.log('✅ Passenger inserted successfully');
          return res.status(201).json({ message: 'Passenger user registered successfully' });
        });
      } else {
        return res.status(201).json({ message: 'User registered successfully' });
      }
    });
  });
// ✅ Login User
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

module.exports = router;
