const supabase = require('../config/supabase');
const { sendDeviceResetEmail } = require('../utils/mailer');
const { generateToken } = require('../utils/helpers');

// GET /api/admin/students  — list all students with filters
const getStudents = async (req, res, next) => {
  try {
    const { status, search } = req.query;
    let query = supabase
      .from('students')
      .select('id, clock_in_id, full_name, email, phone, status, profile_picture, registered_at')
      .order('registered_at', { ascending: false });

    if (status) query = query.eq('status', status);
    if (search) query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%,clock_in_id.ilike.%${search}%`);

    const { data, error } = await query;
    if (error) throw error;
    res.json({ students: data });
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/students/pending  — pending registration requests
const getPendingStudents = async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('students')
      .select('id, clock_in_id, full_name, email, phone, status, profile_picture, registered_at')
      .eq('status', 'pending')
      .order('registered_at', { ascending: true });

    if (error) throw error;
    res.json({ students: data });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/admin/students/:id/approve
const approveStudent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('students')
      .update({ status: 'active' })
      .eq('id', id)
      .eq('status', 'pending')
      .select('id, clock_in_id, full_name, email, status')
      .single();

    if (error || !data) return res.status(404).json({ error: 'Student not found or not pending' });

    // Send notification
    await supabase.from('notifications').insert({
      student_id: id,
      message: `Your registration has been approved! Your Clock-In ID is ${data.clock_in_id}. You can now log in.`,
      type: 'system'
    });

    res.json({ message: 'Student approved successfully', student: data });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/admin/students/:id/suspend
const suspendStudent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const { data, error } = await supabase
      .from('students')
      .update({ status: 'suspended' })
      .eq('id', id)
      .select('id, full_name, email, status')
      .single();

    if (error || !data) return res.status(404).json({ error: 'Student not found' });

    await supabase.from('notifications').insert({
      student_id: id,
      message: `Your account has been suspended. ${reason ? 'Reason: ' + reason : 'Please contact the admin for more information.'}`,
      type: 'warning'
    });

    res.json({ message: 'Student suspended', student: data });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/admin/students/:id/unsuspend
const unsuspendStudent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('students')
      .update({ status: 'active' })
      .eq('id', id)
      .eq('status', 'suspended')
      .select('id, full_name, email, status')
      .single();

    if (error || !data) return res.status(404).json({ error: 'Student not found or not suspended' });

    await supabase.from('notifications').insert({
      student_id: id,
      message: 'Your account suspension has been lifted. You can now log in normally.',
      type: 'system'
    });

    res.json({ message: 'Student unsuspended', student: data });
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/students/:id  — single student detail
const getStudentDetail = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { data: student, error } = await supabase
      .from('students')
      .select('id, clock_in_id, full_name, email, phone, status, profile_picture, registered_at')
      .eq('id', id)
      .single();

    if (error || !student) return res.status(404).json({ error: 'Student not found' });

    // Get recent attendance
    const { data: attendance } = await supabase
      .from('attendance')
      .select('*')
      .eq('student_id', id)
      .order('date', { ascending: false })
      .limit(30);

    res.json({ student, attendance: attendance || [] });
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/attendance  — all attendance records
const getAllAttendance = async (req, res, next) => {
  try {
    const { date, student_id } = req.query;
    let query = supabase
      .from('attendance')
      .select(`
        *,
        students (id, clock_in_id, full_name, email)
      `)
      .order('date', { ascending: false })
      .order('clock_in_time', { ascending: false });

    if (date) query = query.eq('date', date);
    if (student_id) query = query.eq('student_id', student_id);

    const { data, error } = await query;
    if (error) throw error;
    res.json({ attendance: data });
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/device-reset-requests
const getDeviceResetRequests = async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('device_reset_requests')
      .select(`
        *,
        students (id, clock_in_id, full_name, email)
      `)
      .eq('status', 'pending')
      .order('requested_at', { ascending: true });

    if (error) throw error;
    res.json({ requests: data });
  } catch (err) {
    next(err);
  }
};

// POST /api/admin/device-reset-requests/:id/approve
const approveDeviceReset = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data: request, error } = await supabase
      .from('device_reset_requests')
      .select('*, students(id, full_name, email)')
      .eq('id', id)
      .eq('status', 'pending')
      .single();

    if (error || !request) {
      return res.status(404).json({ error: 'Reset request not found or already handled' });
    }

    const resetToken = generateToken();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour

    await supabase
      .from('device_reset_requests')
      .update({ status: 'approved', reset_token: resetToken, resolved_at: new Date().toISOString() })
      .eq('id', id);

    const resetLink = `${process.env.FRONTEND_URL}/device-reset?token=${resetToken}`;
    await sendDeviceResetEmail(
      request.students.email,
      request.students.full_name,
      resetLink
    );

    res.json({ message: 'Reset approved and email sent to student' });
  } catch (err) {
    next(err);
  }
};

// POST /api/admin/device-reset-requests/:id/reject
const rejectDeviceReset = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const { data: request, error } = await supabase
      .from('device_reset_requests')
      .update({ status: 'rejected', resolved_at: new Date().toISOString() })
      .eq('id', id)
      .select('*, students(id, full_name, email)')
      .single();

    if (error || !request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    await supabase.from('notifications').insert({
      student_id: request.student_id,
      message: `Your device reset request was rejected. ${reason || 'Please contact admin for details.'}`,
      type: 'warning'
    });

    res.json({ message: 'Request rejected' });
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/dashboard-stats
const getDashboardStats = async (req, res, next) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const [
      { count: totalStudents },
      { count: pendingApprovals },
      { count: suspended },
      { count: presentToday },
      { count: absentToday },
      { count: pendingResets }
    ] = await Promise.all([
      supabase.from('students').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('students').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('students').select('*', { count: 'exact', head: true }).eq('status', 'suspended'),
      supabase.from('attendance').select('*', { count: 'exact', head: true }).eq('date', today).eq('status', 'present'),
      supabase.from('attendance').select('*', { count: 'exact', head: true }).eq('date', today).eq('status', 'absent'),
      supabase.from('device_reset_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending')
    ]);

    res.json({
      stats: {
        totalStudents,
        pendingApprovals,
        suspended,
        presentToday,
        absentToday,
        pendingResets
      }
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getStudents,
  getPendingStudents,
  approveStudent,
  suspendStudent,
  unsuspendStudent,
  getStudentDetail,
  getAllAttendance,
  getDeviceResetRequests,
  approveDeviceReset,
  rejectDeviceReset,
  getDashboardStats
};
