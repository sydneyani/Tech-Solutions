const express = require('express');
const cors = require('cors');
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');
const scheduleRoutes = require('./routes/scheduleRoutes');
const routeRoutes = require('./routes/routes'); 
const staffRoutes = require('./routes/staffRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const ticketRoutes = require('./routes/ticketRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Logger (optional, helpful for debugging)
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Routes
app.use('/api/users', userRoutes);       // e.g. /api/users/login
app.use('/api/admin', adminRoutes);      // e.g. /api/admin/add-train
app.use('/api/schedules', scheduleRoutes); // ✅ handles schedules + seat routes
app.use('/api/routes', routeRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/payments', paymentRoutes);  // Changed to plural to match client requests
app.use('/api/tickets', ticketRoutes);    // Changed to plural to match client requests

// 404 handler for routes that don't exist
app.use((req, res, next) => {
  res.status(404).json({ error: `Route ${req.method} ${req.url} not found` });
});

// Start server
app.listen(5000, () => {
  console.log('✅ Server running on http://localhost:5000');
  console.log('💡 Payment endpoint: http://localhost:5000/api/payments/process');
  console.log('💡 Ticket endpoint: http://localhost:5000/api/tickets/create');
});