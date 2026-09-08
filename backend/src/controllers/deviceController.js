const supabase = require('../config/supabase');

// POST /api/device/reset-request  — student requests device reset
const requestDeviceReset = async (req, res, next) => {
  try {
    const studentId = req.user.id;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({ error: 'Please provide a reason for the device reset.' });
    }

    // Check for existing pending request
    const { data: existing } = await supabase
      .from('device_reset_requests')
      .select('id')
      .eq('student_id', studentId)
      .eq('status', 'pending')
      .single();

    if (existing) {
      return res.status(400).json({
        error: 'You already have a pending device reset request. Please wait for admin response.'
      });
    }

    const { data, error } = await supabase
      .from('device_reset_requests')
      .insert({ student_id: studentId, reason })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      message: 'Device reset request submitted. Admin will review it shortly.',
      request: data
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/device/reset  — student uses emailed reset token to clear device
const executeDeviceReset = async (req, res, next) => {
  try {
    const { reset_token, device_fingerprint } = req.body;

    if (!reset_token) {
      return res.status(400).json({ error: 'Reset token is required.' });
    }

    // Find the reset request
    const { data: request, error } = await supabase
      .from('device_reset_requests')
      .select('*, students(id, full_name, email)')
      .eq('reset_token', reset_token)
      .eq('status', 'approved')
      .eq('token_used', false)
      .single();

    if (error || !request) {
      return res.status(400).json({ error: 'Invalid, expired, or already used reset link.' });
    }

    const studentId = request.student_id;
    const ip = req.ip || req.connection.remoteAddress;
    const ua = req.headers['user-agent'] || '';

    // Clear old device and set new device
    await supabase
      .from('student_devices')
      .delete()
      .eq('student_id', studentId);

    // Insert new device record
    if (device_fingerprint) {
      await supabase.from('student_devices').insert({
        student_id: studentId,
        ip_address: ip,
        device_fingerprint,
        user_agent: ua
      });
    }

    // Mark token as used
    await supabase
      .from('device_reset_requests')
      .update({ token_used: true })
      .eq('id', request.id);

    // Notify student
    await supabase.from('notifications').insert({
      student_id: studentId,
      message: 'Your device has been reset successfully. You can now log in from your new device.',
      type: 'system'
    });

    res.json({
      message: 'Device reset successful. You can now log in from this device.',
      student_email: request.students.email
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/device/reset-request/status  — check own request status
const getResetRequestStatus = async (req, res, next) => {
  try {
    const studentId = req.user.id;
    const { data, error } = await supabase
      .from('device_reset_requests')
      .select('id, status, reason, requested_at, resolved_at')
      .eq('student_id', studentId)
      .order('requested_at', { ascending: false })
      .limit(1)
      .single();

    res.json({ request: data || null });
  } catch (err) {
    next(err);
  }
};

module.exports = { requestDeviceReset, executeDeviceReset, getResetRequestStatus };
