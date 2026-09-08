require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cron = require('node-cron');

const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const studentRoutes = require('./routes/student');
const attendanceRoutes = require('./routes/attendance');
const qrRoutes = require('./routes/qr');
const deviceRoutes = require('./routes/device');
const { autoClockOutJob } = require('./services/cronJobs');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: true, // allow all origins on local network
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' }
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Trust proxy to get real IP
app.set('trust proxy', 1);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/qr', qrRoutes);
app.use('/api/device', deviceRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
});

// Cron: auto clock-out at 5:30 PM every weekday
// Runs at 17:30 Mon–Fri
cron.schedule('30 17 * * 1-5', () => {
  console.log('[CRON] Running auto clock-out job...');
  autoClockOutJob();
});

// Cron: reminder notification at 5:05 PM every weekday
cron.schedule('5 17 * * 1-5', () => {
  console.log('[CRON] Running clock-out reminder job...');
  const { sendClockOutReminders } = require('./services/cronJobs');
  sendClockOutReminders();
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Punctuality Checker API running on port ${PORT}`);
});

module.exports = app;
