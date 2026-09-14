require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const authRoutes       = require('../src/routes/auth');
const adminRoutes      = require('../src/routes/admin');
const studentRoutes    = require('../src/routes/student');
const attendanceRoutes = require('../src/routes/attendance');
const qrRoutes         = require('../src/routes/qr');
const deviceRoutes     = require('../src/routes/device');

const app = express();

app.use(helmet({
  crossOriginResourcePolicy: false
}));
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set('trust proxy', 1);

app.use('/api/auth',       authRoutes);
app.use('/api/admin',      adminRoutes);
app.use('/api/student',    studentRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/qr',         qrRoutes);
app.use('/api/device',     deviceRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/', (req, res) => {
  res.json({ message: 'Punctuality Checker API', status: 'ok' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.message);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
});

module.exports = app;
