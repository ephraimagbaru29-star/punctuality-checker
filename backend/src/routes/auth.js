const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const {
  adminLogin,
  adminRegister,
  studentRegister,
  studentLogin,
  getMe
} = require('../controllers/authController');

router.post('/admin/login', adminLogin);
router.post('/admin/register', adminRegister);
router.post('/student/register', studentRegister);
router.post('/student/login', studentLogin);
router.get('/me', authenticate, getMe);

module.exports = router;
