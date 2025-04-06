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

// ✅ POST to book a seat and insert into bookings table (works for any user)
router.post('/seats/book', (req, res) => {
    const { seat_id, user_id, schedule_id } = req.body;
  
    // First check if the seat is already booked
    const checkSeatQuery = `
      SELECT is_booked
      FROM seats
      WHERE seat_id = ?
    `;
  
    db.query(checkSeatQuery, [seat_id], (checkErr, checkResult) => {
      if (checkErr) {
        console.error('Error checking seat status:', checkErr);
        return res.status(500).json({ error: 'Failed to check seat availability' });
      }
  
      if (checkResult.length === 0) {
        return res.status(404).json({ error: 'Seat not found' });
      }
  
      if (checkResult[0].is_booked) {
        return res.status(400).json({ error: 'This seat is already booked' });
      }
  
      // Begin transaction to ensure data consistency
      db.beginTransaction(err => {
        if (err) {
          console.error('Error starting transaction:', err);
          return res.status(500).json({ error: 'Database error' });
        }
  
        // 1. Update seat to booked
        const updateSeatQuery = `
          UPDATE seats
          SET is_booked = TRUE
          WHERE seat_id = ?
        `;
  
        db.query(updateSeatQuery, [seat_id], (seatErr) => {
          if (seatErr) {
            return db.rollback(() => {
              console.error('Error updating seat:', seatErr);
              res.status(500).json({ error: 'Failed to book seat' });
            });
          }
  
          // 2. Insert into bookings table
          const insertBookingQuery = `
            INSERT INTO bookings (user_id, schedule_id, booking_date)
            VALUES (?, ?, NOW())
          `;
  
          db.query(insertBookingQuery, [user_id, schedule_id], (bookingErr, bookingResult) => {
            if (bookingErr) {
              return db.rollback(() => {
                console.error('Error inserting booking:', bookingErr);
                res.status(500).json({ error: 'Failed to create booking' });
              });
            }
  
            const booking_id = bookingResult.insertId;
  
            // 3. Get user info - Modified to work with any user role
            const getUserInfoQuery = `
              SELECT 
                first_name, 
                last_name, 
                gender, 
                TIMESTAMPDIFF(YEAR, dob, CURDATE()) AS age,
                role
              FROM users
              WHERE user_id = ?
            `;
  
            db.query(getUserInfoQuery, [user_id], (userErr, userResult) => {
              if (userErr) {
                return db.rollback(() => {
                  console.error('Error fetching user info:', userErr);
                  res.status(500).json({ error: 'Failed to retrieve user details' });
                });
              }
  
              if (userResult.length === 0) {
                return db.rollback(() => {
                  console.error('No user found with ID:', user_id);
                  res.status(404).json({ error: 'User not found' });
                });
              }
  
              const user = userResult[0];
              console.log('User booking a seat:', user);
  
              // Use first_name or full name based on availability
              const passenger_name = user.last_name 
                ? `${user.first_name} ${user.last_name}` 
                : user.first_name;
              
              // Use default values if data is missing
              const age = user.age || 30;
              const gender = user.gender || 'Not specified';
  
              // 4. Insert booking details
              const insertDetailsQuery = `
                INSERT INTO booking_details (booking_id, passenger_name, age, gender, seat_id)
                VALUES (?, ?, ?, ?, ?)
              `;
  
              db.query(insertDetailsQuery, [booking_id, passenger_name, age, gender, seat_id], (detailsErr) => {
                if (detailsErr) {
                  return db.rollback(() => {
                    console.error('Error inserting booking details:', detailsErr);
                    res.status(500).json({ error: 'Failed to insert booking details' });
                  });
                }
  
                // Commit the transaction
                db.commit(commitErr => {
                  if (commitErr) {
                    return db.rollback(() => {
                      console.error('Error committing transaction:', commitErr);
                      res.status(500).json({ error: 'Failed to complete booking' });
                    });
                  }
  
                  res.status(200).json({ 
                    message: 'Seat booked and booking details saved!',
                    booking_id,
                    seat_id
                  });
                });
              });
            });
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
