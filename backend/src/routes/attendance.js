const router = require('express').Router();
const { authenticate, requireStudent, requireActiveStudent } = require('../middleware/auth');
const {
  clockIn,
  clockOut,
  getTodayAttendance,
  getAttendanceHistory
} = require('../controllers/attendanceController');

router.use(authenticate, requireStudent, requireActiveStudent);

router.post('/clock-in', clockIn);
router.post('/clock-out', clockOut);
router.get('/today', getTodayAttendance);
router.get('/history', getAttendanceHistory);

module.exports = router;
