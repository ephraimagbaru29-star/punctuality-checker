const jwt = require('jsonwebtoken');
const supabase = require('../config/supabase');

// Verify JWT and attach user to request
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, role, email }
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// Only allow admins
const requireAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// Only allow students
const requireStudent = (req, res, next) => {
  if (req.user?.role !== 'student') {
    return res.status(403).json({ error: 'Student access required' });
  }
  next();
};

// Check student is active (not suspended/pending)
const requireActiveStudent = async (req, res, next) => {
  try {
    const { data: student, error } = await supabase
      .from('students')
      .select('status')
      .eq('id', req.user.id)
      .single();

    if (error || !student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    if (student.status === 'suspended') {
      return res.status(403).json({ error: 'Your account has been suspended. Contact admin.' });
    }
    if (student.status === 'pending') {
      return res.status(403).json({ error: 'Your account is pending approval from admin.' });
    }
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = { authenticate, requireAdmin, requireStudent, requireActiveStudent };
