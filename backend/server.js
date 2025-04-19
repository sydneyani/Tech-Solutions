const express = require('express');
const cors = require('cors');

// Route imports
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');
const scheduleRoutes = require('./routes/scheduleRoutes');
const routeRoutes = require('./routes/routes');
const staffRoutes = require('./routes/staffRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const ticketRoutes = require('./routes/ticketRoutes');
const passengerRoutes = require('./routes/passengerRoutes');

const app = express();

// ✅ CORS setup (open for all origins — adjust later if needed)
app.use(cors());
app.options('*', cors()); // handles preflight requests

// ✅ Middleware
app.use(express.json());

// ✅ Logger
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// ✅ Routes
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/routes', routeRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/passengers', passengerRoutes);

// ✅ Simple test route
app.get('/api/ping', (req, res) => {
  res.json({ message: 'pong' });
});

// ✅ 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ✅ Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Backend running on port ${PORT}`);
});
