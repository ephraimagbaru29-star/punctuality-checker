const router = require('express').Router();
const { authenticate, requireAdmin } = require('../middleware/auth');
const { generateQR, listQRCodes, deactivateQR, validateQRToken } = require('../controllers/qrController');

// Public — frontend checks token validity before showing registration form
router.get('/validate/:token', validateQRToken);

// Admin-only routes
router.post('/generate', authenticate, requireAdmin, generateQR);
router.get('/', authenticate, requireAdmin, listQRCodes);
router.patch('/:id/deactivate', authenticate, requireAdmin, deactivateQR);

module.exports = router;
