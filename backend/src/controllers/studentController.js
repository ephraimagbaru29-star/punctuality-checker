const supabase = require('../config/supabase');

// GET /api/student/notifications
const getNotifications = async (req, res, next) => {
  try {
    const studentId = req.user.id;
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    res.json({ notifications: data });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/student/notifications/:id/read
const markNotificationRead = async (req, res, next) => {
  try {
    const studentId = req.user.id;
    const { id } = req.params;

    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id)
      .eq('student_id', studentId);

    res.json({ message: 'Marked as read' });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/student/notifications/read-all
const markAllNotificationsRead = async (req, res, next) => {
  try {
    const studentId = req.user.id;
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('student_id', studentId)
      .eq('is_read', false);

    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    next(err);
  }
};

// GET /api/student/profile
const getProfile = async (req, res, next) => {
  try {
    const studentId = req.user.id;
    const { data, error } = await supabase
      .from('students')
      .select('id, clock_in_id, full_name, email, phone, status, profile_picture, registered_at')
      .eq('id', studentId)
      .single();

    if (error || !data) return res.status(404).json({ error: 'Profile not found' });
    res.json({ profile: data });
  } catch (err) {
    next(err);
  }
};

// GET /api/student/unread-count
const getUnreadCount = async (req, res, next) => {
  try {
    const studentId = req.user.id;
    const { count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('student_id', studentId)
      .eq('is_read', false);

    res.json({ unread: count || 0 });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  getProfile,
  getUnreadCount
};
