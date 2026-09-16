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

/**
 * Calculate distance between two GPS coordinates using Haversine formula
 * Returns distance in meters
 */
const getDistanceMeters = (lat1, lng1, lat2, lng2) => {
  const R = 6371000; // Earth radius in meters
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Check if a coordinate is within the configured geofence
 * Returns { allowed: bool, distance: number }
 */
const checkGeofence = (lat, lng) => {
  const centerLat = parseFloat(process.env.GEOFENCE_LAT || '8.928293');
  const centerLng = parseFloat(process.env.GEOFENCE_LNG || '11.3308633');
  const radius    = parseFloat(process.env.GEOFENCE_RADIUS_METERS || '100');

  const distance = getDistanceMeters(lat, lng, centerLat, centerLng);
  return { allowed: distance <= radius, distance: Math.round(distance) };
};

module.exports = {
  generateClockInId,
  generateToken,
  todayDate,
  currentHour,
  isBeforeClockIn,
  isBeforeClockOut,
  hashFingerprint,
  checkGeofence
};
