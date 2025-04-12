const express = require('express');
const router = express.Router();
const db = require('../db');

// Get passenger by ID
router.get('/:user_id', (req, res) => {
  const { user_id } = req.params;
  
  const query = `
    SELECT u.user_id, u.username, u.first_name, u.last_name, u.email, 
           u.gender, u.dob, u.mobile, u.role
    FROM users u
    WHERE u.user_id = ? AND u.role = 'Passenger'
  `;
  
  db.query(query, [user_id], (err, results) => {
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

// Get travel history for a passenger with payment date and method
router.get('/:user_id/history', (req, res) => {
  const { user_id } = req.params;
  
  // Create query that fetches travel history with details including payment date and method
  const query = `
    SELECT 
      b.booking_id,
      bd.booking_detail_id,
      s.schedule_id,
      s.travel_date,
      s.departure_time,
      s.arrival_time,
      t.name AS train_name,
      t.train_number,
      r.name AS route_name,
      bd.passenger_name,
      bd.seat_id,
      seats.seat_number,
      seats.class_type,
      ticket.ticket_id,
      CASE
        WHEN p.status = 'Paid' THEN 'Completed'
        WHEN p.status = 'Failed' THEN 'Payment Failed'
        ELSE 'Pending'
      END AS status,
      p.amount,
      p.method,
      p.payment_date,
      th.history_id,
      th.trip_date
    FROM bookings b
    JOIN booking_details bd ON b.booking_id = bd.booking_id
    JOIN schedules s ON b.schedule_id = s.schedule_id
    JOIN trains t ON s.train_id = t.train_id
    JOIN routes r ON t.route_id = r.route_id
    JOIN seats ON bd.seat_id = seats.seat_id
    LEFT JOIN tickets ticket ON b.booking_id = ticket.booking_id
    LEFT JOIN payments p ON b.booking_id = p.booking_id
    LEFT JOIN travel_history th ON b.booking_id = th.booking_id
    WHERE b.user_id = ?
    ORDER BY s.travel_date DESC, s.departure_time DESC
  `;
  
  db.query(query, [user_id], (err, results) => {
    if (err) {
      console.error('Error fetching travel history:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    // If there are results, update travel_history table
    if (results.length > 0) {
      // For each booking record, ensure it's in travel_history
      const insertPromises = results.map(booking => {
        return new Promise((resolve, reject) => {
          // Only insert if there's no history record for this booking yet
          if (!booking.history_id) {
            const insertHistoryQuery = `
              INSERT INTO travel_history (passenger_id, booking_id, trip_date)
              VALUES (?, ?, ?)
              ON DUPLICATE KEY UPDATE trip_date = VALUES(trip_date)
            `;
            
            db.query(
              insertHistoryQuery, 
              [user_id, booking.booking_id, booking.travel_date],
              (insertErr) => {
                if (insertErr) {
                  console.error('Error updating travel history:', insertErr);
                  reject(insertErr);
                } else {
                  resolve();
                }
              }
            );
          } else {
            resolve();
          }
        });
      });
      
      // Execute all inserts/updates
      Promise.all(insertPromises)
        .then(() => {
          // Return the results regardless of update status
          res.status(200).json(results);
        })
        .catch(error => {
          console.error('Error updating travel history records:', error);
          // Still return results even if updates failed
          res.status(200).json(results);
        });
    } else {
      // No history found
      res.status(200).json([]);
    }
  });
});

// Update travel history
router.post('/history', (req, res) => {
  const { passenger_id, booking_id, trip_date } = req.body;
  
  if (!passenger_id || !booking_id || !trip_date) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  const query = `
    INSERT INTO travel_history (passenger_id, booking_id, trip_date)
    VALUES (?, ?, ?)
    ON DUPLICATE KEY UPDATE trip_date = VALUES(trip_date)
  `;
  
  db.query(query, [passenger_id, booking_id, trip_date], (err, result) => {
    if (err) {
      console.error('Error creating travel history record:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    res.status(201).json({
      history_id: result.insertId,
      passenger_id,
      booking_id,
      trip_date
    });
  });
});

module.exports = router;