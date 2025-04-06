const express = require('express');
const router = express.Router();
const db = require('../db');

// Create ticket - simplified to only use what's in your database schema
router.post('/create', (req, res) => {
  const { booking_id } = req.body;
  
  if (!booking_id) {
    return res.status(400).json({ error: 'Booking ID is required' });
  }
  
  // Check if booking exists
  const checkBookingQuery = `
    SELECT booking_id FROM bookings WHERE booking_id = ?
  `;
  
  db.query(checkBookingQuery, [booking_id], (err, results) => {
    if (err) {
      console.error('Error checking booking:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (results.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    // Check if ticket already exists
    const checkTicketQuery = `
      SELECT ticket_id FROM tickets WHERE booking_id = ?
    `;
    
    db.query(checkTicketQuery, [booking_id], (err, ticketResults) => {
      if (err) {
        console.error('Error checking existing ticket:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      
      // If ticket already exists, return it
      if (ticketResults.length > 0) {
        return res.status(200).json({
          ticket_id: ticketResults[0].ticket_id,
          booking_id: booking_id,
          issued_date: new Date()
        });
      }
      
      // Create a new ticket with just the fields in your schema
      const createTicketQuery = `
        INSERT INTO tickets (booking_id, issued_date)
        VALUES (?, NOW())
      `;
      
      db.query(createTicketQuery, [booking_id], (err, result) => {
        if (err) {
          console.error('Error creating ticket:', err);
          return res.status(500).json({ error: 'Failed to create ticket' });
        }
        
        const ticket_id = result.insertId;
        
        // Get full ticket details to return
        const getTicketDetailsQuery = `
          SELECT t.ticket_id, t.booking_id, t.issued_date,
                 b.user_id, b.schedule_id
          FROM tickets t
          JOIN bookings b ON t.booking_id = b.booking_id
          WHERE t.ticket_id = ?
        `;
        
        db.query(getTicketDetailsQuery, [ticket_id], (err, detailResults) => {
          if (err) {
            console.error('Error fetching ticket details:', err);
            return res.status(500).json({ 
              ticket_id: ticket_id,
              booking_id: booking_id,
              issued_date: new Date()
            });
          }
          
          res.status(201).json(detailResults[0] || {
            ticket_id: ticket_id,
            booking_id: booking_id,
            issued_date: new Date()
          });
        });
      });
    });
  });
});

module.exports = router;