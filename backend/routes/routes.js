// routes/routes.js
const express = require('express');
const router = express.Router();
const db = require('../db');

// GET all routes
router.get('/', (req, res) => {
  db.query('SELECT * FROM routes', (err, results) => {
    if (err) {
      console.error('Error fetching routes:', err);
      return res.status(500).json({ error: 'Failed to fetch routes' });
    }
    res.json(results);
  });
});

// POST new route
router.post('/', (req, res) => {
  const { name } = req.body;
  db.query('INSERT INTO routes (name) VALUES (?)', [name], (err, result) => {
    if (err) {
      console.error('Error inserting route:', err);
      return res.status(500).json({ error: 'Failed to add route' });
    }
    res.json({ route_id: result.insertId, name });
  });
});

module.exports = router;
