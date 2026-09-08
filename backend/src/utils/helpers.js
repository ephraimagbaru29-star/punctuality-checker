const crypto = require('crypto');

/**
 * Generate a unique Clock-In ID for students (e.g. "PC-4F2A")
 */
const generateClockInId = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'PC-';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * Generate a secure random token
 */
const generateToken = (bytes = 32) => {
  return crypto.randomBytes(bytes).toString('hex');
};

/**
 * Get today's date as YYYY-MM-DD string
 */
const todayDate = () => {
  return new Date().toISOString().split('T')[0];
};

/**
 * Get current hour in local server time (0-23)
 */
const currentHour = () => new Date().getHours();

/**
 * Check if current time is before clock-in time (9:00 AM)
 */
const isBeforeClockIn = () => {
  const clockInHour = parseInt(process.env.CLOCK_IN_HOUR || '9');
  return new Date().getHours() < clockInHour;
};

/**
 * Check if current time is before clock-out time (5:00 PM)
 */
const isBeforeClockOut = () => {
  const clockOutHour = parseInt(process.env.CLOCK_OUT_HOUR || '17');
  const now = new Date();
  return now.getHours() < clockOutHour;
};

/**
 * Hash a device fingerprint (IP + UA) for storage
 */
const hashFingerprint = (data) => {
  return crypto.createHash('sha256').update(data).digest('hex');
};

module.exports = {
  generateClockInId,
  generateToken,
  todayDate,
  currentHour,
  isBeforeClockIn,
  isBeforeClockOut,
  hashFingerprint
};
