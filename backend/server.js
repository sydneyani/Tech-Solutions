const express = require('express');
const cors = require('cors');
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');
const scheduleRoutes = require('./routes/scheduleRoutes');
const routeRoutes = require('./routes/routes'); 
const staffRoutes = require('./routes/staffRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const ticketRoutes = require('./routes/ticketRoutes');
const passengerRoutes = require('./routes/passengerRoutes');

const app = express();

// CORS setup - simpler configuration
app.use(cors());

// JSON middleware
app.use(express.json());

// Logger
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Database setup
if (process.env.SETUP_DB === 'true') {
  console.log('Running database setup...');
  require('./db-setup');
}

// Test routes
app.get('/api/test', (req, res) => {
  res.status(200).json({ message: 'API is working!' });
});

// Routes
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/routes', routeRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/passengers', passengerRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: `Route not found` });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
