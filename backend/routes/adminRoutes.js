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

router.post('/add-schedule', (req, res) => {
    const { train_id, travel_date, departure_time, arrival_time } = req.body;
  
    const scheduleQuery = `
      INSERT INTO schedules (train_id, travel_date, departure_time, arrival_time)
      VALUES (?, ?, ?, ?)
    `;
  
    db.query(scheduleQuery, [train_id, travel_date, departure_time, arrival_time], (err, result) => {
      if (err) {
        console.error('Error inserting schedule:', err);
        return res.status(500).json({ error: 'Failed to add schedule' });
      }
  
      const schedule_id = result.insertId;
  
      // Generate 15 AC and 15 SL seat values
      const seats = [];
      for (let i = 1; i <= 15; i++) {
        seats.push([schedule_id, 'AC', `A${i}`]);
      }
      for (let i = 1; i <= 15; i++) {
        seats.push([schedule_id, 'SL', `S${i}`]);
      }
  
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
  
// ✅ Delete schedule and its seats by schedule_id
router.delete('/delete-schedule/:schedule_id', (req, res) => {
    const { schedule_id } = req.params;
  
    const deleteSeatsQuery = `DELETE FROM seats WHERE schedule_id = ?`;
    const deleteScheduleQuery = `DELETE FROM schedules WHERE schedule_id = ?`;
  
    // First delete the seats, then the schedule
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
  
  // ✅ Delete train by ID (and related schedules + seats)
router.delete('/delete-train/:train_id', (req, res) => {
    const { train_id } = req.params;
  
    // First, find and delete all related schedules
    const findSchedulesQuery = `SELECT schedule_id FROM schedules WHERE train_id = ?`;
  
    db.query(findSchedulesQuery, [train_id], (err, schedules) => {
      if (err) {
        console.error('Error finding related schedules:', err);
        return res.status(500).json({ error: 'Failed to find schedules' });
      }
  
      const scheduleIds = schedules.map(s => s.schedule_id);
  
      if (scheduleIds.length > 0) {
        // Delete all seats linked to these schedules
        const deleteSeatsQuery = `DELETE FROM seats WHERE schedule_id IN (?)`;
        db.query(deleteSeatsQuery, [scheduleIds], (err2) => {
          if (err2) {
            console.error('Error deleting seats:', err2);
            return res.status(500).json({ error: 'Failed to delete seats' });
          }
  
          // Delete schedules next
          const deleteSchedulesQuery = `DELETE FROM schedules WHERE schedule_id IN (?)`;
          db.query(deleteSchedulesQuery, [scheduleIds], (err3) => {
            if (err3) {
              console.error('Error deleting schedules:', err3);
              return res.status(500).json({ error: 'Failed to delete schedules' });
            }
  
            // Finally delete the train
            const deleteTrainQuery = `DELETE FROM trains WHERE train_id = ?`;
            db.query(deleteTrainQuery, [train_id], (err4) => {
              if (err4) {
                console.error('Error deleting train:', err4);
                return res.status(500).json({ error: 'Failed to delete train' });
              }
  
              res.status(200).json({ message: 'Train and all related data deleted successfully' });
            });
          });
        });
      } else {
        // If no schedules, just delete the train
        const deleteTrainQuery = `DELETE FROM trains WHERE train_id = ?`;
        db.query(deleteTrainQuery, [train_id], (err5) => {
          if (err5) {
            console.error('Error deleting train:', err5);
            return res.status(500).json({ error: 'Failed to delete train' });
          }
          res.status(200).json({ message: 'Train deleted (no schedules)' });
        });
      }
    });
  });

  
module.exports = router;
