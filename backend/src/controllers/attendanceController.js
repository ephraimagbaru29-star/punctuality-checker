const supabase = require('../config/supabase');
const { todayDate, isBeforeClockIn, isBeforeClockOut } = require('../utils/helpers');

// POST /api/attendance/clock-in
const clockIn = async (req, res, next) => {
  try {
    const studentId = req.user.id;
    const today = todayDate();

    // Enforce 9:00 AM rule
    if (isBeforeClockIn()) {
      const clockInHour = process.env.CLOCK_IN_HOUR || '9';
      return res.status(400).json({
        error: `Clock-in is not allowed before ${clockInHour}:00 AM.`
      });
    }

    // Check if already clocked in today
    const { data: existing } = await supabase
      .from('attendance')
      .select('*')
      .eq('student_id', studentId)
      .eq('date', today)
      .single();

    if (existing?.clock_in_time) {
      return res.status(400).json({ error: 'You have already clocked in today.' });
    }

    const ip = req.ip || req.connection.remoteAddress;
    const deviceFingerprint = req.body.device_fingerprint || '';
    const { location_lat, location_lng, location_address } = req.body;

    const now = new Date().toISOString();

    // Determine status: check if clocked in after 9:15am = late
    const clockInHour = parseInt(process.env.CLOCK_IN_HOUR || '9');
    const currentTime = new Date();
    const graceMinutes = 15;
    const isLate = currentTime.getHours() > clockInHour ||
      (currentTime.getHours() === clockInHour && currentTime.getMinutes() > graceMinutes);

    let record;
    if (existing) {
      // Update existing record (could be pre-created absent placeholder)
      const { data, error } = await supabase
        .from('attendance')
        .update({
          clock_in_time: now,
          status: isLate ? 'late' : 'present',
          ip_address: ip,
          device_fingerprint: deviceFingerprint,
          location_lat,
          location_lng,
          location_address
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;
      record = data;
    } else {
      const { data, error } = await supabase
        .from('attendance')
        .insert({
          student_id: studentId,
          date: today,
          clock_in_time: now,
          status: isLate ? 'late' : 'present',
          ip_address: ip,
          device_fingerprint: deviceFingerprint,
          location_lat,
          location_lng,
          location_address
        })
        .select()
        .single();

      if (error) throw error;
      record = data;
    }

    res.json({
      message: isLate ? 'Clocked in (late).' : 'Clocked in successfully.',
      attendance: record
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/attendance/clock-out
const clockOut = async (req, res, next) => {
  try {
    const studentId = req.user.id;
    const today = todayDate();
    const { reason } = req.body; // 'emergency' | 'not_feeling_good' | 'tired' | null (on-time)

    const { data: existing, error } = await supabase
      .from('attendance')
      .select('*')
      .eq('student_id', studentId)
      .eq('date', today)
      .single();

    if (error || !existing || !existing.clock_in_time) {
      return res.status(400).json({ error: 'You have not clocked in today.' });
    }

    if (existing.clock_out_time) {
      return res.status(400).json({ error: 'You have already clocked out today.' });
    }

    // Early clock-out: require a reason if before 5pm
    if (isBeforeClockOut()) {
      const validReasons = ['emergency', 'not_feeling_good', 'tired'];
      if (!reason || !validReasons.includes(reason)) {
        return res.status(400).json({
          error: 'Please select a reason for clocking out early.',
          requires_reason: true,
          options: [
            { value: 'emergency', label: 'Emergency' },
            { value: 'not_feeling_good', label: 'Not Feeling Good' },
            { value: 'tired', label: 'Just Being Tired' }
          ]
        });
      }
    }

    const now = new Date().toISOString();
    const { data, error: updateError } = await supabase
      .from('attendance')
      .update({
        clock_out_time: now,
        clock_out_reason: reason || null
      })
      .eq('id', existing.id)
      .select()
      .single();

    if (updateError) throw updateError;

    res.json({
      message: 'Clocked out successfully.',
      attendance: data
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/attendance/today  — student's today record
const getTodayAttendance = async (req, res, next) => {
  try {
    const studentId = req.user.id;
    const today = todayDate();

    const { data, error } = await supabase
      .from('attendance')
      .select('*')
      .eq('student_id', studentId)
      .eq('date', today)
      .single();

    // No record is not an error — just means not clocked in
    res.json({ attendance: data || null });
  } catch (err) {
    next(err);
  }
};

// GET /api/attendance/history  — student's full history
const getAttendanceHistory = async (req, res, next) => {
  try {
    const studentId = req.user.id;
    const { limit = 30, offset = 0 } = req.query;

    const { data, error, count } = await supabase
      .from('attendance')
      .select('*', { count: 'exact' })
      .eq('student_id', studentId)
      .order('date', { ascending: false })
      .range(Number(offset), Number(offset) + Number(limit) - 1);

    if (error) throw error;
    res.json({ attendance: data, total: count });
  } catch (err) {
    next(err);
  }
};

module.exports = { clockIn, clockOut, getTodayAttendance, getAttendanceHistory };
