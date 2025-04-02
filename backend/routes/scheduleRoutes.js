const express = require('express');
const router = express.Router();
const db = require('../db');

// ✅ GET all schedules with train name
router.get('/', (req, res) => {
  const query = `
    SELECT 
      s.schedule_id,
      s.travel_date,
      s.departure_time,
      s.arrival_time,
      t.name AS train_name
    FROM schedules s
    JOIN trains t ON s.train_id = t.train_id
    ORDER BY s.travel_date ASC
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching schedules:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(results);
  });
});

// ✅ GET all trains (for admin dropdown)
router.get('/trains', (req, res) => {
  const query = `SELECT * FROM trains`;

  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching trains:', err);
      return res.status(500).json({ error: 'Failed to fetch trains' });
    }
    res.json(results);
  });
});

// ✅ GET all seats for a specific schedule
router.get('/seats/:schedule_id', (req, res) => {
  const { schedule_id } = req.params;
  const query = `
    SELECT seat_id, seat_number, is_booked
    FROM seats
    WHERE schedule_id = ?
    ORDER BY seat_number ASC
  `;
  db.query(query, [schedule_id], (err, results) => {
    if (err) {
      console.error('Error fetching seats:', err);
      return res.status(500).json({ error: 'Failed to fetch seats' });
    }
    res.json(results);
  });
});

// ✅ POST to book a seat and insert into bookings table only
router.post('/seats/book', (req, res) => {
    const { seat_id, user_id, schedule_id } = req.body;
  
    const updateSeatQuery = `
      UPDATE seats
      SET is_booked = TRUE
      WHERE seat_id = ?
    `;
  
    const insertBookingQuery = `
      INSERT INTO bookings (user_id, schedule_id, booking_date)
      VALUES (?, ?, NOW())
    `;
  
    db.query(updateSeatQuery, [seat_id], (seatErr) => {
      if (seatErr) {
        console.error('Error updating seat:', seatErr);
        return res.status(500).json({ error: 'Failed to book seat' });
      }
  
      db.query(insertBookingQuery, [user_id, schedule_id], (bookingErr, bookingResult) => {
        if (bookingErr) {
          console.error('Error inserting booking:', bookingErr);
          return res.status(500).json({ error: 'Failed to create booking' });
        }
  
        const booking_id = bookingResult.insertId;
  
        const getUserInfoQuery = `
          SELECT u.first_name, u.gender, TIMESTAMPDIFF(YEAR, u.dob, CURDATE()) AS age
          FROM users u
          JOIN passenger p ON u.user_id = p.passenger_id
          WHERE u.user_id = ?
        `;
  
        db.query(getUserInfoQuery, [user_id], (userErr, userResult) => {
          if (userErr || userResult.length === 0) {
            console.error('Error fetching user info:', userErr || 'No user found');
            return res.status(500).json({ error: 'Failed to retrieve passenger details' });
          }
  
          const { first_name, gender, age } = userResult[0];
  
          const insertDetailsQuery = `
            INSERT INTO booking_details (booking_id, passenger_name, age, gender, seat_id)
            VALUES (?, ?, ?, ?, ?)
          `;
  
          db.query(insertDetailsQuery, [booking_id, first_name, age, gender, seat_id], (detailsErr) => {
            if (detailsErr) {
              console.error('Error inserting booking details:', detailsErr);
              return res.status(500).json({ error: 'Failed to insert booking details' });
            }
  
            res.status(200).json({ message: 'Seat booked and booking details saved!' });
          });
        });
      });
    });
  });
  
  
  // ✅ Add new schedule
  router.post('/admin/add-schedule', (req, res) => {
    const { train_id, travel_date, departure_time, arrival_time } = req.body;
    const query = `
      INSERT INTO schedules (train_id, travel_date, departure_time, arrival_time)
      VALUES (?, ?, ?, ?)
    `;
  
    db.query(query, [train_id, travel_date, departure_time, arrival_time], (err, result) => {
      if (err) {
        console.error('Error inserting schedule:', err);
        return res.status(500).json({ error: 'Failed to add schedule' });
      }
      res.status(200).json({ message: 'Schedule added successfully' });
    });
  });
  
  // ✅ Delete train by ID
  router.delete('/admin/delete-train/:train_id', (req, res) => {
    const { train_id } = req.params;
    const query = `DELETE FROM trains WHERE train_id = ?`;
  
    db.query(query, [train_id], (err, result) => {
      if (err) {
        console.error('Error deleting train:', err);
        return res.status(500).json({ error: 'Failed to delete train' });
      }
      res.status(200).json({ message: 'Train deleted successfully' });
    });
  });
  
// ✅ Add new train (CLEAN VERSION – ONLY THIS SHOULD EXIST)
router.post('/admin/add-train', (req, res) => {
    const { train_number, name, route_id } = req.body;
  
    const query = `
      INSERT INTO trains (train_number, name, route_id)
      VALUES (?, ?, ?)
    `;
  
    db.query(query, [train_number, name, route_id], (err, result) => {
      if (err) {
        console.error('Error adding train:', err);
        return res.status(500).json({ error: 'Failed to add train' });
      }
      res.status(200).json({ message: 'Train added successfully' });
    });
  });

// ✅ Get all routes (for dropdown)
router.get('/routes', (req, res) => {
    const query = `SELECT * FROM routes`;
    db.query(query, (err, results) => {
      if (err) {
        console.error('Error fetching routes:', err);
        return res.status(500).json({ error: 'Failed to fetch routes' });
      }
      res.json(results);
    });
  });
  
  // ✅ Add new route
  router.post('/routes', (req, res) => {
    const { name } = req.body;
    const query = `INSERT INTO routes (name) VALUES (?)`;
    db.query(query, [name], (err, result) => {
      if (err) {
        console.error('Error inserting route:', err);
        return res.status(500).json({ error: 'Failed to add route' });
      }
      res.json({ route_id: result.insertId, name });
    });
  });

  

module.exports = router;
