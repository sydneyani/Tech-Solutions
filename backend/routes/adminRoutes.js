const express = require('express');
const router = express.Router();
const db = require('../db');

// ✅ Add a new train using route_id
router.post('/add-train', (req, res) => {
  const { train_number, name, route_id } = req.body;

  const query = `
    INSERT INTO trains (train_number, name, route_id)
    VALUES (?, ?, ?)
  `;

  db.query(query, [train_number, name, route_id], (err, result) => {
    if (err) {
      console.error('Error adding train:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.status(201).json({ message: 'Train added successfully' });
  });
});

// ✅ Add a new schedule and seats
router.post('/add-schedule', (req, res) => {
  const { train_id, travel_date, departure_time, arrival_time } = req.body;

  const insertSchedule = `
    INSERT INTO schedules (train_id, travel_date, departure_time, arrival_time)
    VALUES (?, ?, ?, ?)
  `;

  db.query(insertSchedule, [train_id, travel_date, departure_time, arrival_time], (err, result) => {
    if (err) {
      console.error('Error inserting schedule:', err);
      return res.status(500).json({ error: 'Failed to add schedule' });
    }

    const schedule_id = result.insertId;
    const seats = [];

    for (let i = 1; i <= 15; i++) seats.push([schedule_id, 'AC', `A${i}`]);
    for (let i = 1; i <= 15; i++) seats.push([schedule_id, 'SL', `S${i}`]);

    const seatQuery = `
      INSERT INTO seats (schedule_id, class_type, seat_number)
      VALUES ?
    `;

    db.query(seatQuery, [seats], (err2) => {
      if (err2) {
        console.error('Error inserting seats:', err2);
        return res.status(500).json({ error: 'Schedule created, but failed to add seats' });
      }

      res.status(200).json({ message: 'Schedule and seats added successfully' });
    });
  });
});

// ✅ Delete schedule and related seats
router.delete('/delete-schedule/:schedule_id', (req, res) => {
  const { schedule_id } = req.params;

  const deleteSeatsQuery = `DELETE FROM seats WHERE schedule_id = ?`;
  const deleteScheduleQuery = `DELETE FROM schedules WHERE schedule_id = ?`;

  db.query(deleteSeatsQuery, [schedule_id], (seatErr) => {
    if (seatErr) {
      console.error('Error deleting seats:', seatErr);
      return res.status(500).json({ error: 'Failed to delete associated seats' });
    }

    db.query(deleteScheduleQuery, [schedule_id], (scheduleErr) => {
      if (scheduleErr) {
        console.error('Error deleting schedule:', scheduleErr);
        return res.status(500).json({ error: 'Failed to delete schedule' });
      }

      res.status(200).json({ message: 'Schedule and seats deleted successfully' });
    });
  });
});

// ✅ Delete train and cascade delete related schedules + seats
router.delete('/delete-train/:train_id', (req, res) => {
  const { train_id } = req.params;

  const findSchedules = `SELECT schedule_id FROM schedules WHERE train_id = ?`;

  db.query(findSchedules, [train_id], (err, schedules) => {
    if (err) {
      console.error('Error finding related schedules:', err);
      return res.status(500).json({ error: 'Failed to find schedules' });
    }

    const scheduleIds = schedules.map(s => s.schedule_id);

    const deleteSeats = `DELETE FROM seats WHERE schedule_id IN (?)`;
    const deleteSchedules = `DELETE FROM schedules WHERE schedule_id IN (?)`;
    const deleteTrain = `DELETE FROM trains WHERE train_id = ?`;

    const cascadeDelete = () => {
      db.query(deleteTrain, [train_id], (err4) => {
        if (err4) {
          console.error('Error deleting train:', err4);
          return res.status(500).json({ error: 'Failed to delete train' });
        }
        res.status(200).json({ message: 'Train and all related data deleted successfully' });
      });
    };

    if (scheduleIds.length > 0) {
      db.query(deleteSeats, [scheduleIds], (err2) => {
        if (err2) return res.status(500).json({ error: 'Failed to delete seats' });

        db.query(deleteSchedules, [scheduleIds], (err3) => {
          if (err3) return res.status(500).json({ error: 'Failed to delete schedules' });
          cascadeDelete();
        });
      });
    } else {
      cascadeDelete(); // No schedules, just delete the train
    }
  });
});

// ✅ UPDATE TRAIN
router.put('/edit-train/:train_id', (req, res) => {
    const { train_id } = req.params;
    const { train_number, name, route_id } = req.body;
  
    const updateQuery = `
      UPDATE trains
      SET train_number = ?, name = ?, route_id = ?
      WHERE train_id = ?
    `;
  
    db.query(updateQuery, [train_number, name, route_id, train_id], (err) => {
      if (err) {
        console.error('Error updating train:', err);
        return res.status(500).json({ error: 'Failed to update train' });
      }
      res.status(200).json({ message: 'Train updated successfully' });
    });
  });

// ✅ Update Schedule by ID
router.put('/edit-schedule/:schedule_id', (req, res) => {
    const { schedule_id } = req.params;
    const { train_id, travel_date, departure_time, arrival_time } = req.body;
  
    console.log('Updating schedule:', { train_id, travel_date, departure_time, arrival_time });
  
    const updateQuery = `
      UPDATE schedules
      SET train_id = ?, travel_date = ?, departure_time = ?, arrival_time = ?
      WHERE schedule_id = ?
    `;
  
    db.query(updateQuery, [train_id, travel_date, departure_time, arrival_time, schedule_id], (err) => {
      if (err) {
        console.error('❌ Error updating schedule:', err);
        return res.status(500).json({ error: 'Failed to update schedule' });
      }
      res.status(200).json({ message: '✅ Schedule updated successfully' });
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



// Generate reports for ticket sales, demographics, and train occupancy
router.get('/reports/sales', (req, res) => {
  const query = `
    SELECT 
      s.schedule_id,
      t.name AS train_name,
      t.train_number,
      s.travel_date,
      COUNT(p.payment_id) AS ticket_count,
      SUM(p.amount) AS total_sales
    FROM schedules s
    JOIN trains t ON s.train_id = t.train_id
    LEFT JOIN bookings b ON s.schedule_id = b.schedule_id
    LEFT JOIN payments p ON b.booking_id = p.booking_id
    WHERE p.status = 'Paid'
    GROUP BY s.schedule_id, t.name, t.train_number, s.travel_date
    ORDER BY s.travel_date DESC
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error('Error generating sales report:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.status(200).json(results);
  });
});

// Gender demographics report
router.get('/reports/demographics', (req, res) => {
  const query = `
    SELECT 
      bd.gender,
      COUNT(*) AS passenger_count,
      ROUND((COUNT(*) / (SELECT COUNT(*) FROM booking_details)) * 100, 2) AS percentage
    FROM booking_details bd
    GROUP BY bd.gender
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error('Error generating demographics report:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.status(200).json(results);
  });
});

// Train occupancy report
router.get('/reports/occupancy', (req, res) => {
  const query = `
    SELECT 
      s.schedule_id,
      t.name AS train_name,
      t.train_number,
      s.travel_date,
      COUNT(CASE WHEN se.is_booked = 1 THEN 1 END) AS booked_seats,
      COUNT(se.seat_id) AS total_seats,
      ROUND((COUNT(CASE WHEN se.is_booked = 1 THEN 1 END) / COUNT(se.seat_id)) * 100, 2) AS occupancy_rate
    FROM schedules s
    JOIN trains t ON s.train_id = t.train_id
    JOIN seats se ON s.schedule_id = se.schedule_id
    GROUP BY s.schedule_id, t.name, t.train_number, s.travel_date
    ORDER BY s.travel_date DESC
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error('Error generating occupancy report:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.status(200).json(results);
  });
});



// Remove a passenger by schedule_id and seat_number with full booking cleanup
router.delete('/remove-passenger/schedule/:schedule_id/seat/:seat_number', (req, res) => {
  const { schedule_id, seat_number } = req.params;
  
  console.log(`Attempting to free up seat: schedule=${schedule_id}, seat_number=${seat_number}`);
  
  // First find the seat ID using schedule_id and seat_number
  const findSeatQuery = `
    SELECT seat_id, is_booked, class_type 
    FROM seats 
    WHERE schedule_id = ? AND seat_number = ?
  `;
  
  db.query(findSeatQuery, [schedule_id, seat_number], (findErr, seatResults) => {
    if (findErr) {
      console.error('Error finding seat:', findErr);
      return res.status(500).json({ error: 'Database error finding seat' });
    }
    
    if (seatResults.length === 0) {
      console.error(`Seat not found: schedule=${schedule_id}, seat_number=${seat_number}`);
      return res.status(404).json({ error: 'Seat not found' });
    }
    
    const seat = seatResults[0];
    console.log('Found seat:', seat);
    
    if (!seat.is_booked) {
      console.warn(`Seat ${seat_number} in schedule ${schedule_id} is not currently booked`);
      return res.status(400).json({ error: 'Seat is not currently booked' });
    }
    
    const seat_id = seat.seat_id;
    
    // Find the booking detail for this seat
    const findBookingDetailQuery = `
      SELECT bd.booking_detail_id, bd.booking_id, bd.passenger_name
      FROM booking_details bd
      WHERE bd.seat_id = ?
    `;
    
    db.query(findBookingDetailQuery, [seat_id], (detailErr, detailResults) => {
      if (detailErr) {
        console.error('Error finding booking detail:', detailErr);
        return res.status(500).json({ error: 'Database error finding booking detail' });
      }
      
      if (detailResults.length === 0) {
        console.warn(`Seat ${seat_number} is marked as booked but has no booking detail`);
      } else {
        console.log('Found booking detail:', detailResults[0]);
      }
      
      // Transaction to update the seat and remove booking detail
      db.beginTransaction(err => {
        if (err) {
          console.error('Error starting transaction:', err);
          return res.status(500).json({ error: 'Database error starting transaction' });
        }
        
        // 1. Update seat to mark as not booked
        const updateSeatQuery = `
          UPDATE seats 
          SET is_booked = 0 
          WHERE seat_id = ?
        `;
        
        db.query(updateSeatQuery, [seat_id], (updateErr) => {
          if (updateErr) {
            return db.rollback(() => {
              console.error('Error updating seat:', updateErr);
              res.status(500).json({ error: 'Failed to update seat' });
            });
          }
          
          console.log(`Successfully marked seat ${seat_number} as not booked`);
          
          // If we have a booking detail, remove it
          if (detailResults.length > 0) {
            const bookingDetail = detailResults[0];
            const deleteDetailQuery = `
              DELETE FROM booking_details 
              WHERE booking_detail_id = ?
            `;
            
            db.query(deleteDetailQuery, [bookingDetail.booking_detail_id], (deleteErr) => {
              if (deleteErr) {
                return db.rollback(() => {
                  console.error('Error deleting booking detail:', deleteErr);
                  res.status(500).json({ error: 'Failed to delete booking detail' });
                });
              }
              
              console.log(`Successfully deleted booking detail ${bookingDetail.booking_detail_id}`);
              
              // Check if this was the last seat for this booking
              const checkRemainingSeatsQuery = `
                SELECT COUNT(*) as count
                FROM booking_details
                WHERE booking_id = ?
              `;
              
              db.query(checkRemainingSeatsQuery, [bookingDetail.booking_id], (countErr, countResults) => {
                if (countErr) {
                  return db.rollback(() => {
                    console.error('Error counting remaining seats:', countErr);
                    res.status(500).json({ error: 'Failed to check remaining seats' });
                  });
                }
                
                const seatsRemaining = countResults[0].count;
                console.log(`Seats remaining for booking ${bookingDetail.booking_id}: ${seatsRemaining}`);
                
                // If this was the last seat, clean up the booking and associated records
                if (seatsRemaining === 0) {
                  console.log(`Cleaning up booking ${bookingDetail.booking_id} as it has no more seats`);
                  
                  // Clean up related records in this order:
                  // 1. Delete from travel_history if exists
                  // 2. Delete from tickets if exists
                  // 3. Delete from payments if exists
                  // 4. Finally delete the booking record
                  
                  // 1. Delete from travel_history
                  const deleteTravelHistoryQuery = `
                    DELETE FROM travel_history 
                    WHERE booking_id = ?
                  `;
                  
                  db.query(deleteTravelHistoryQuery, [bookingDetail.booking_id], (historyErr) => {
                    if (historyErr) {
                      console.error('Error deleting travel history:', historyErr);
                      // Continue even if this fails
                    }
                    
                    // 2. Delete from tickets
                    const deleteTicketsQuery = `
                      DELETE FROM tickets 
                      WHERE booking_id = ?
                    `;
                    
                    db.query(deleteTicketsQuery, [bookingDetail.booking_id], (ticketsErr) => {
                      if (ticketsErr) {
                        console.error('Error deleting tickets:', ticketsErr);
                        // Continue even if this fails
                      }
                      
                      // 3. Delete from payments
                      const deletePaymentsQuery = `
                        DELETE FROM payments 
                        WHERE booking_id = ?
                      `;
                      
                      db.query(deletePaymentsQuery, [bookingDetail.booking_id], (paymentsErr) => {
                        if (paymentsErr) {
                          console.error('Error deleting payments:', paymentsErr);
                          // Continue even if this fails
                        }
                        
                        // 4. Delete the booking record
                        const deleteBookingQuery = `
                          DELETE FROM bookings 
                          WHERE booking_id = ?
                        `;
                        
                        db.query(deleteBookingQuery, [bookingDetail.booking_id], (bookingErr) => {
                          if (bookingErr) {
                            return db.rollback(() => {
                              console.error('Error deleting booking:', bookingErr);
                              res.status(500).json({ error: 'Failed to delete booking' });
                            });
                          }
                          
                          console.log(`Successfully deleted booking ${bookingDetail.booking_id}`);
                          
                          // Commit the transaction
                          db.commit(err => {
                            if (err) {
                              return db.rollback(() => {
                                console.error('Error committing transaction:', err);
                                res.status(500).json({ error: 'Failed to commit changes' });
                              });
                            }
                            
                            console.log(`Successfully removed passenger from seat ${seat_number} and cleaned up booking ${bookingDetail.booking_id}`);
                            
                            res.status(200).json({ 
                              message: 'Passenger and booking removed successfully',
                              seat: {
                                schedule_id,
                                seat_number,
                                class_type: seat.class_type
                              },
                              passenger: bookingDetail.passenger_name,
                              bookingRemoved: true,
                              bookingId: bookingDetail.booking_id
                            });
                          });
                        });
                      });
                    });
                  });
                } else {
                  // Seats remaining, just commit the current changes
                  db.commit(err => {
                    if (err) {
                      return db.rollback(() => {
                        console.error('Error committing transaction:', err);
                        res.status(500).json({ error: 'Failed to commit changes' });
                      });
                    }
                    
                    console.log(`Successfully removed passenger from seat ${seat_number}. Remaining seats for booking: ${seatsRemaining}`);
                    
                    res.status(200).json({ 
                      message: 'Passenger removed successfully',
                      seat: {
                        schedule_id,
                        seat_number,
                        class_type: seat.class_type
                      },
                      passenger: bookingDetail.passenger_name,
                      seatsRemaining
                    });
                  });
                }
              });
            });
          } else {
            // No booking detail found, just commit the seat update
            db.commit(err => {
              if (err) {
                return db.rollback(() => {
                  console.error('Error committing transaction:', err);
                  res.status(500).json({ error: 'Failed to commit changes' });
                });
              }
              
              console.log(`Successfully freed up seat ${seat_number}`);
              res.status(200).json({ 
                message: 'Seat freed up successfully',
                seat: {
                  schedule_id,
                  seat_number,
                  class_type: seat.class_type
                }
              });
            });
          }
        });
      });
    });
  });
});


module.exports = router;
