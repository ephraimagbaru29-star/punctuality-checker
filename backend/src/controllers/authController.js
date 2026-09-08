const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const supabase = require('../config/supabase');
const { generateClockInId } = require('../utils/helpers');

const signToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

// POST /api/auth/admin/login
const adminLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const { data: admin, error } = await supabase
      .from('admins')
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .single();

    if (error || !admin) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(password, admin.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = signToken({ id: admin.id, role: 'admin', email: admin.email });
    res.json({
      token,
      user: { id: admin.id, name: admin.name, email: admin.email, role: 'admin' }
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/admin/register  (first-time setup — can be locked after first admin created)
const adminRegister = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    // Check if any admin exists (only allow first admin or authenticated admin)
    const { count } = await supabase
      .from('admins')
      .select('*', { count: 'exact', head: true });

    if (count > 0) {
      // Only existing admins can create new admins
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(403).json({ error: 'Admin already exists. Must be authenticated to create another admin.' });
      }
    }

    const hash = await bcrypt.hash(password, 12);
    const { data: admin, error } = await supabase
      .from('admins')
      .insert({ name, email: email.toLowerCase().trim(), password_hash: hash })
      .select('id, name, email')
      .single();

    if (error) {
      if (error.code === '23505') return res.status(409).json({ error: 'Email already in use' });
      throw error;
    }

    const token = signToken({ id: admin.id, role: 'admin', email: admin.email });
    res.status(201).json({
      token,
      user: { id: admin.id, name: admin.name, email: admin.email, role: 'admin' }
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/student/register  (requires valid QR token)
const studentRegister = async (req, res, next) => {
  try {
    const {
      full_name, email, phone, password,
      qr_token, profile_picture
    } = req.body;

    if (!full_name || !email || !password || !qr_token) {
      return res.status(400).json({ error: 'Name, email, password and QR token are required' });
    }

    // Validate QR token
    const { data: qr, error: qrError } = await supabase
      .from('qr_codes')
      .select('*')
      .eq('token', qr_token)
      .eq('is_active', true)
      .single();

    if (qrError || !qr) {
      return res.status(400).json({ error: 'Invalid or expired QR code' });
    }

    if (qr.expires_at && new Date(qr.expires_at) < new Date()) {
      return res.status(400).json({ error: 'QR code has expired' });
    }

    // Check email not already used
    const { data: existing } = await supabase
      .from('students')
      .select('id')
      .eq('email', email.toLowerCase().trim())
      .single();

    if (existing) return res.status(409).json({ error: 'Email already registered' });

    // Generate unique clock-in ID
    let clockInId;
    let unique = false;
    while (!unique) {
      clockInId = generateClockInId();
      const { data: exists } = await supabase
        .from('students')
        .select('id')
        .eq('clock_in_id', clockInId)
        .single();
      if (!exists) unique = true;
    }

    const hash = await bcrypt.hash(password, 12);
    const { data: student, error: insertError } = await supabase
      .from('students')
      .insert({
        full_name,
        email: email.toLowerCase().trim(),
        phone,
        password_hash: hash,
        clock_in_id: clockInId,
        qr_token,
        profile_picture: profile_picture || null,
        status: 'pending'
      })
      .select('id, clock_in_id, full_name, email, status')
      .single();

    if (insertError) throw insertError;

    res.status(201).json({
      message: 'Registration successful. Awaiting admin approval.',
      student: {
        id: student.id,
        clock_in_id: student.clock_in_id,
        full_name: student.full_name,
        email: student.email,
        status: student.status
      }
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/student/login
const studentLogin = async (req, res, next) => {
  try {
    const { clock_in_id, password } = req.body;
    if (!clock_in_id || !password) {
      return res.status(400).json({ error: 'Clock-in ID and password are required' });
    }

    const { data: student, error } = await supabase
      .from('students')
      .select('*')
      .eq('clock_in_id', clock_in_id.toUpperCase().trim())
      .single();

    if (error || !student) {
      return res.status(401).json({ error: 'Invalid Clock-in ID or password' });
    }

    if (student.status === 'suspended') {
      return res.status(403).json({ error: 'Your account has been suspended. Contact admin.' });
    }
    if (student.status === 'pending') {
      return res.status(403).json({ error: 'Your account is pending admin approval.' });
    }

    const valid = await bcrypt.compare(password, student.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid Clock-in ID or password' });

    // Get device info from request
    const ip = req.ip || req.connection.remoteAddress;
    const ua = req.headers['user-agent'] || '';
    const incomingFingerprint = req.body.device_fingerprint || '';

    // Check if device is locked
    const { data: device } = await supabase
      .from('student_devices')
      .select('*')
      .eq('student_id', student.id)
      .single();

    if (device) {
      // Compare stored fingerprint
      if (
        device.ip_address !== ip ||
        device.device_fingerprint !== incomingFingerprint
      ) {
        return res.status(403).json({
          error: 'Device not recognized. If you changed devices, request a device reset.',
          device_mismatch: true
        });
      }
    } else {
      // First login — lock the device
      await supabase.from('student_devices').insert({
        student_id: student.id,
        ip_address: ip,
        device_fingerprint: incomingFingerprint,
        user_agent: ua
      });
    }

    const token = signToken({
      id: student.id,
      role: 'student',
      email: student.email,
      clock_in_id: student.clock_in_id
    });

    res.json({
      token,
      user: {
        id: student.id,
        clock_in_id: student.clock_in_id,
        full_name: student.full_name,
        email: student.email,
        status: student.status,
        profile_picture: student.profile_picture,
        role: 'student'
      }
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/auth/me
const getMe = async (req, res, next) => {
  try {
    const { id, role } = req.user;
    const table = role === 'admin' ? 'admins' : 'students';
    const { data, error } = await supabase
      .from(table)
      .select(role === 'admin'
        ? 'id, name, email'
        : 'id, clock_in_id, full_name, email, phone, status, profile_picture, registered_at')
      .eq('id', id)
      .single();

    if (error || !data) return res.status(404).json({ error: 'User not found' });
    res.json({ user: { ...data, role } });
  } catch (err) {
    next(err);
  }
};

module.exports = { adminLogin, adminRegister, studentRegister, studentLogin, getMe };
