const express = require('express');
const cors = require('cors');
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');
const scheduleRoutes = require('./routes/scheduleRoutes');
const routeRoutes = require('./routes/routes'); // ✅ this is new
const staffRoutes = require('./routes/staffRoutes');


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


// Start server
app.listen(5000, () => {
  console.log('✅ Server running on http://localhost:5000');
});
