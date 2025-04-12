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
        seats.class_type,
        p.amount,
        p.method,
        p.payment_date,
        p.status AS payment_status
      FROM seats
      JOIN booking_details bd ON seats.seat_id = bd.seat_id
      JOIN bookings b ON bd.booking_id = b.booking_id
      JOIN schedules s ON b.schedule_id = s.schedule_id
      JOIN trains t ON s.train_id = t.train_id
      JOIN users u ON b.user_id = u.user_id
      LEFT JOIN payments p ON b.booking_id = p.booking_id
      WHERE seats.is_booked = 1
      ORDER BY s.travel_date ASC, s.schedule_id
    `;
  
    db.query(query, (err, results) => {
      if (err) {
        console.error('Error fetching rides with passengers:', err);
        return res.status(500).json({ error: 'Failed to fetch rides: ' + err.message });
      }
  
      console.log(`Retrieved ${results.length} passenger records`);
      
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
          class_type: row.class_type,
          payment_amount: row.amount,
          payment_method: row.method,
          payment_date: row.payment_date,
          payment_status: row.payment_status
        };
        
        grouped[row.schedule_id].passengers.push(passenger);
      });
  
      res.json(Object.values(grouped));
    });
  });

// Get passenger details by username
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

// Get travel history for a staff member
router.get('/:user_id/history', (req, res) => {
  const { user_id } = req.params;
  
  // First we need to check if this staff member exists in the passenger table
  const checkStaffQuery = `
    SELECT passenger_id FROM passenger WHERE passenger_id = ?
  `;
  
  db.query(checkStaffQuery, [user_id], (checkErr, checkResults) => {
    if (checkErr) {
      console.error('Error checking staff in passenger table:', checkErr);
      return res.status(500).json({ error: 'Database error' });
    }
    
    // If staff is not in passenger table, add them
    if (checkResults.length === 0) {
      // Get user info first
      const getUserQuery = `
        SELECT user_id, first_name, last_name FROM users WHERE user_id = ? AND role = 'Staff'
      `;
      
      db.query(getUserQuery, [user_id], (userErr, userResults) => {
        if (userErr || userResults.length === 0) {
          console.error('Error fetching staff info:', userErr);
          return res.status(404).json({ error: 'Staff member not found' });
        }
        
        // Insert the staff as a passenger (just for travel history purposes)
        const insertPassengerQuery = `
          INSERT IGNORE INTO passenger (passenger_id) VALUES (?)
        `;
        
        db.query(insertPassengerQuery, [user_id], (insertErr) => {
          if (insertErr) {
            console.error('Error adding staff to passenger table:', insertErr);
            return res.status(500).json({ error: 'Database error' });
          }
          
          // Now proceed to get travel history
          fetchTravelHistory();
        });
      });
    } else {
      // Staff is already in passenger table, proceed to get travel history
      fetchTravelHistory();
    }
  });
  
  // Function to fetch travel history with payment date and method
  const fetchTravelHistory = () => {
    // Updated query to include only necessary payment details
    const historyQuery = `
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
    
    db.query(historyQuery, [user_id], (err, results) => {
      if (err) {
        console.error('Error fetching staff travel history:', err);
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
  };
});

module.exports = router;