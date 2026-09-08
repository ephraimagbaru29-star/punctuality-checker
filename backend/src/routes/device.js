const router = require('express').Router();
const { authenticate, requireStudent } = require('../middleware/auth');
const {
  requestDeviceReset,
  executeDeviceReset,
  getResetRequestStatus
} = require('../controllers/deviceController');

// Public route — student clicks link from email (no auth token needed)
router.post('/reset', executeDeviceReset);

// Student-authenticated routes
router.post('/reset-request', authenticate, requireStudent, requestDeviceReset);
router.get('/reset-request/status', authenticate, requireStudent, getResetRequestStatus);

module.exports = router;
