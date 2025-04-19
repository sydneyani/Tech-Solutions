const express = require('express');
const cors = require('cors');
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');
const scheduleRoutes = require('./routes/scheduleRoutes');
const routeRoutes = require('./routes/routes'); 
const staffRoutes = require('./routes/staffRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const ticketRoutes = require('./routes/ticketRoutes');
const passengerRoutes = require('./routes/passengerRoutes'); // Add passenger routes

const app = express();

// Middleware
app.use(cors({
  origin: '*', // For testing, allow all origins
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
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
app.use('/api/payments', paymentRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/passengers', passengerRoutes); // Add new passenger routes

// 404 handler for routes that don't exist
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`, req.body);
  next();
});


// Start server (for Railway or local dev)
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
