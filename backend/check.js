// Check all requires load correctly
const fs = require('fs');
const errors = [];
commit
const files = [
  './src/config/supabase',
  './src/controllers/authController',
  './src/controllers/adminController',
  './src/controllers/attendanceController',
  './src/controllers/qrController',
  './src/controllers/deviceController',
  './src/controllers/studentController',
  './src/middleware/auth',
  './src/routes/auth',
  './src/routes/admin',
  './src/routes/student',
  './src/routes/attendance',
  './src/routes/qr',
  './src/routes/device',
  './src/services/cronJobs',
  './src/utils/helpers',
  './src/utils/mailer',
];

require('dotenv').config();

for (const f of files) {
  try {
    require(f);
    console.log('✅', f);
  } catch(e) {
    console.log('❌', f, '->', e.message);
    errors.push({ f, msg: e.message });
  }
}

if (errors.length === 0) {
  console.log('\nAll modules OK');
} else {
  console.log('\n' + errors.length + ' error(s) found');
}
