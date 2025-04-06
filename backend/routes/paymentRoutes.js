const express = require('express');
const router = express.Router();
const db = require('../db');

// Process payment and create payment record
router.post('/process', (req, res) => {
  const { user_id, seat_id, schedule_id, amount, payment_method } = req.body;
  
  console.log('Payment request received:', { user_id, seat_id, schedule_id, amount, payment_method });
  
  // Start transaction
  db.beginTransaction(err => {
    if (err) {
      console.error('Error starting transaction:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    // First check if booking exists
    const checkBookingQuery = `
      SELECT booking_id FROM bookings 
      WHERE user_id = ? AND schedule_id = ?
    `;
    
    db.query(checkBookingQuery, [user_id, schedule_id], (err, results) => {
      if (err) {
        return db.rollback(() => {
          console.error('Error checking booking:', err);
          res.status(500).json({ error: 'Database error' });
        });
      }
      
      let booking_id;
      
      // If booking exists, use it
      if (results.length > 0) {
        booking_id = results[0].booking_id;
        createPayment(booking_id);
      } else {
        // Create a new booking
        const createBookingQuery = `
          INSERT INTO bookings (user_id, schedule_id, booking_date)
          VALUES (?, ?, NOW())
        `;
        
        db.query(createBookingQuery, [user_id, schedule_id], (err, result) => {
          if (err) {
            return db.rollback(() => {
              console.error('Error creating booking:', err);
              res.status(500).json({ error: 'Failed to create booking' });
            });
          }
          
          booking_id = result.insertId;
          
          // Get user info for booking details
          const getUserQuery = `
            SELECT first_name, last_name, gender, TIMESTAMPDIFF(YEAR, dob, CURDATE()) AS age
            FROM users WHERE user_id = ?
          `;
          
          db.query(getUserQuery, [user_id], (err, userResults) => {
            if (err || userResults.length === 0) {
              return db.rollback(() => {
                console.error('Error getting user details:', err || 'User not found');
                res.status(500).json({ error: 'Failed to get user info' });
              });
            }
            
            const user = userResults[0];
            const passenger_name = user.last_name 
              ? `${user.first_name} ${user.last_name}`
              : user.first_name;
              
            // Create booking detail
            const createDetailQuery = `
              INSERT INTO booking_details (booking_id, passenger_name, age, gender, seat_id)
              VALUES (?, ?, ?, ?, ?)
            `;
            
            const age = user.age || 30;
            const gender = user.gender || 'Not specified';
            
            db.query(createDetailQuery, [booking_id, passenger_name, age, gender, seat_id], (err) => {
              if (err) {
                return db.rollback(() => {
                  console.error('Error creating booking detail:', err);
                  res.status(500).json({ error: 'Failed to create booking detail' });
                });
              }
              
              // Mark seat as booked
              const updateSeatQuery = `
                UPDATE seats SET is_booked = TRUE WHERE seat_id = ?
              `;
              
              db.query(updateSeatQuery, [seat_id], (err) => {
                if (err) {
                  return db.rollback(() => {
                    console.error('Error updating seat:', err);
                    res.status(500).json({ error: 'Failed to update seat' });
                  });
                }
                
                createPayment(booking_id);
              });
            });
          });
        });
      }
      
      // Create payment record
      function createPayment(booking_id) {
        // Insert only the fields that exist in your database
        const paymentQuery = `
          INSERT INTO payments (booking_id, amount, method, status)
          VALUES (?, ?, ?, 'Paid')
        `;
        
        db.query(paymentQuery, [booking_id, amount, payment_method], (err) => {
          if (err) {
            return db.rollback(() => {
              console.error('Error creating payment:', err);
              res.status(500).json({ error: 'Failed to create payment' });
            });
          }
          
          // Commit transaction
          db.commit(err => {
            if (err) {
              return db.rollback(() => {
                console.error('Error committing transaction:', err);
                res.status(500).json({ error: 'Failed to complete payment' });
              });
            }
            
            res.status(200).json({
              success: true,
              message: 'Payment successful',
              booking_id: booking_id
            });
          });
        });
      }
    });
  });
});

module.exports = router;