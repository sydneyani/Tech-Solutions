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

// ✅ CORS Setup - Make sure this is FIRST before any route/middleware
const allowedOrigins = [
  'https://tech-solutions-production-e796.up.railway.app', // frontend
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS Not Allowed'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true
}));

// ✅ Ensure preflight requests are handled
app.options('*', cors());

// ✅ JSON middleware
app.use(express.json());

// ✅ Logger
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// ✅ Optional DB setup flag
if (process.env.SETUP_DB === 'true') {
  console.log('Running database setup...');
  require('./db-setup');
}

// ✅ Test route
app.get('/api/test', (req, res) => {
  res.status(200).json({ message: 'API is working!' });
});

// ✅ Main routes
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/routes', routeRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/passengers', passengerRoutes);

// ✅ 404 fallback
app.use((req, res) => {
  res.status(404).json({ error: `Route not found` });
});

// ✅ Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
