const router = require('express').Router();
const { authenticate, requireStudent, requireActiveStudent } = require('../middleware/auth');
const {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  getProfile,
  getUnreadCount
} = require('../controllers/studentController');

router.use(authenticate, requireStudent);

router.get('/profile', requireActiveStudent, getProfile);
router.get('/notifications', getNotifications);
router.get('/notifications/unread-count', getUnreadCount);
router.patch('/notifications/:id/read', markNotificationRead);
router.patch('/notifications/read-all', markAllNotificationsRead);

module.exports = router;
