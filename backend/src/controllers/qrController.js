const bwipjs = require('bwip-js');
const supabase = require('../config/supabase');
const { generateToken } = require('../utils/helpers');

// POST /api/qr/generate  — admin generates a QR code
const generateQR = async (req, res, next) => {
  try {
    const adminId = req.user.id;
    const { label, expires_hours } = req.body; // optional label and expiry

    const token = generateToken(16); // 32-char hex token
    const expiresAt = expires_hours
      ? new Date(Date.now() + Number(expires_hours) * 60 * 60 * 1000).toISOString()
      : null;

    const { data: qrRecord, error } = await supabase
      .from('qr_codes')
      .insert({
        token,
        admin_id: adminId,
        label: label || 'Registration QR',
        is_active: true,
        expires_at: expiresAt
      })
      .select()
      .single();

    if (error) throw error;

    // The QR code encodes the registration URL
    const registrationUrl = `${process.env.FRONTEND_URL}/register?token=${token}`;

    // Generate QR PNG with bwip-js
    const png = await bwipjs.toBuffer({
      bcid: 'qrcode',
      text: registrationUrl,
      scale: 4,
      height: 40,
      includetext: false,
      eclevel: 'M'
    });

    res.json({
      qr_code: {
        id: qrRecord.id,
        token: qrRecord.token,
        label: qrRecord.label,
        registration_url: registrationUrl,
        expires_at: qrRecord.expires_at,
        created_at: qrRecord.created_at,
        qr_image_base64: `data:image/png;base64,${png.toString('base64')}`
      }
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/qr  — list all QR codes for admin
const listQRCodes = async (req, res, next) => {
  try {
    const adminId = req.user.id;
    const { data, error } = await supabase
      .from('qr_codes')
      .select('*')
      .eq('admin_id', adminId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ qr_codes: data });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/qr/:id/deactivate
const deactivateQR = async (req, res, next) => {
  try {
    const { id } = req.params;
    const adminId = req.user.id;

    const { data, error } = await supabase
      .from('qr_codes')
      .update({ is_active: false })
      .eq('id', id)
      .eq('admin_id', adminId)
      .select()
      .single();

    if (error || !data) return res.status(404).json({ error: 'QR code not found' });
    res.json({ message: 'QR code deactivated', qr_code: data });
  } catch (err) {
    next(err);
  }
};

// GET /api/qr/validate/:token  — public route for frontend to validate token before showing register form
const validateQRToken = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { data, error } = await supabase
      .from('qr_codes')
      .select('id, token, label, is_active, expires_at')
      .eq('token', token)
      .single();

    if (error || !data) {
      return res.status(404).json({ valid: false, error: 'Invalid QR code' });
    }

    if (!data.is_active) {
      return res.status(400).json({ valid: false, error: 'This QR code has been deactivated' });
    }

    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      return res.status(400).json({ valid: false, error: 'This QR code has expired' });
    }

    res.json({ valid: true, label: data.label });
  } catch (err) {
    next(err);
  }
};

module.exports = { generateQR, listQRCodes, deactivateQR, validateQRToken };
