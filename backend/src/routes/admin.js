const router = require('express').Router();
const { authenticate, requireAdmin } = require('../middleware/auth');
const {
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
} = require('../controllers/adminController');

router.use(authenticate, requireAdmin);

router.get('/dashboard', getDashboardStats);
router.get('/students', getStudents);
router.get('/students/pending', getPendingStudents);
router.get('/students/:id', getStudentDetail);
router.patch('/students/:id/approve', approveStudent);
router.patch('/students/:id/suspend', suspendStudent);
router.patch('/students/:id/unsuspend', unsuspendStudent);
router.get('/attendance', getAllAttendance);
router.get('/device-reset-requests', getDeviceResetRequests);
router.post('/device-reset-requests/:id/approve', approveDeviceReset);
router.post('/device-reset-requests/:id/reject', rejectDeviceReset);

module.exports = router;
