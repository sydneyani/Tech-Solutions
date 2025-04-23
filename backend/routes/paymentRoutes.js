const express = require('express');
const router = express.Router();
const db = require('../db');

// Process payment and create payment record for multiple seats
router.post('/process', (req, res) => {
  const { user_id, seat_ids, schedule_id, amount, payment_method } = req.body;
  
  // Validate input
  if (!Array.isArray(seat_ids) || seat_ids.length === 0) {
    return res.status(400).json({ error: 'No seats selected' });
  }
  
  console.log('Payment request received:', { 
    user_id, 
    seat_ids: Array.isArray(seat_ids) ? seat_ids : [seat_ids], 
    schedule_id, 
    amount, 
    payment_method 
  });
  
  // Ensure seat_ids is always an array (for backward compatibility)
  const seatsToBook = Array.isArray(seat_ids) ? seat_ids : [seat_ids];
  
  // Start transaction
  db.beginTransaction(err => {
    if (err) {
      console.error('Error starting transaction:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    // First check if any of the selected seats are already booked
    const seatPlaceholders = seatsToBook.map(() => '?').join(',');
    const checkSeatsQuery = `
      SELECT seat_id, is_booked 
      FROM seats
      WHERE seat_id IN (${seatPlaceholders})
    `;
    
    db.query(checkSeatsQuery, seatsToBook, (err, seatResults) => {
      if (err) {
        return db.rollback(() => {
          console.error('Error checking seats:', err);
          res.status(500).json({ error: 'Database error' });
        });
      }
      
      // Check if any seat is already booked
      const bookedSeats = seatResults.filter(seat => seat.is_booked);
      if (bookedSeats.length > 0) {
        return db.rollback(() => {
          res.status(400).json({ 
            error: 'One or more seats are already booked', 
            seatAlreadyBooked: true,
            bookedSeatIds: bookedSeats.map(seat => seat.seat_id)
          });
        });
      }
      
      // Create a single booking for all seats
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
        
        const booking_id = result.insertId;
        
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
          
          const age = user.age || 30;
          const gender = user.gender || 'Not specified';
          
          // Create booking details for each seat
          let processedSeats = 0;
          let bookingDetailsError = false;
          
          seatsToBook.forEach(seat_id => {
            // Create booking detail for this seat
            const createDetailQuery = `
              INSERT INTO booking_details (booking_id, passenger_name, age, gender, seat_id)
              VALUES (?, ?, ?, ?, ?)
            `;
            
            db.query(createDetailQuery, [booking_id, passenger_name, age, gender, seat_id], (err) => {
              if (err) {
                bookingDetailsError = true;
                console.error('Error creating booking detail:', err);
                return;
              }
              
              // Mark seat as booked
              const updateSeatQuery = `
                UPDATE seats SET is_booked = TRUE WHERE seat_id = ?
              `;
              
              db.query(updateSeatQuery, [seat_id], (err) => {
                if (err) {
                  bookingDetailsError = true;
                  console.error('Error updating seat:', err);
                  return;
                }
                
                processedSeats++;
                
                // After all seats are processed, create payment
                if (processedSeats === seatsToBook.length && !bookingDetailsError) {
                  createPayment(booking_id);
                } else if (processedSeats === seatsToBook.length && bookingDetailsError) {
                  db.rollback(() => {
                    res.status(500).json({ error: 'Failed to create booking details or update seats' });
                  });
                }
              });
            });
          });
        });
      });
      
      function createPayment(booking_id) {
        const paymentQuery = `
          INSERT INTO payments (booking_id, amount, method, status, payment_date)
          VALUES (?, ?, ?, 'Paid', NOW())
        `;
      
        db.query(paymentQuery, [booking_id, amount, payment_method], (err) => {
          if (err) {
            return db.rollback(() => {
              console.error('Error creating payment:', err);
              return res.status(500).json({ error: 'Failed to create payment' });
            });
          }
      
          // Update payment_status in bookings table
          const updateBookingStatusQuery = `
            UPDATE bookings
            SET payment_status = ?
            WHERE booking_id = ?
          `;
      
          db.query(updateBookingStatusQuery, ['Completed', booking_id], (err) => {
            if (err) {
              return db.rollback(() => {
                console.error('Error updating booking payment_status:', err);
                return res.status(500).json({ error: 'Failed to update booking payment status' });
              });
            }
      
            // Commit transaction
            db.commit(err => {
              if (err) {
                return db.rollback(() => {
                  console.error('Error committing transaction:', err);
                  return res.status(500).json({ error: 'Failed to complete payment' });
                });
              }
      
              // Send success response
              return res.status(200).json({
                success: true,
                message: 'Payment successful',
                booking_id: booking_id
              });
            });
          });
        });
      }
    });
  });
});

module.exports = router;
