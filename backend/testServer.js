require('dotenv').config();

console.log('Testing server.js startup...');

try {
  console.log('1. Loading express...');
  const express = require('express'); console.log('   ✅');

  console.log('2. Loading cors...');
  const cors = require('cors'); console.log('   ✅');

  console.log('3. Loading helmet...');
  const helmet = require('helmet'); console.log('   ✅');

  console.log('4. Loading express-rate-limit...');
  const rateLimit = require('express-rate-limit'); console.log('   ✅');

  console.log('5. Loading node-cron...');
  const cron = require('node-cron'); console.log('   ✅');

  console.log('6. Loading routes...');
  const authRoutes       = require('./src/routes/auth');       console.log('   ✅ auth');
  const adminRoutes      = require('./src/routes/admin');      console.log('   ✅ admin');
  const studentRoutes    = require('./src/routes/student');    console.log('   ✅ student');
  const attendanceRoutes = require('./src/routes/attendance'); console.log('   ✅ attendance');
  const qrRoutes         = require('./src/routes/qr');         console.log('   ✅ qr');
  const deviceRoutes     = require('./src/routes/device');     console.log('   ✅ device');

  console.log('7. Loading cronJobs...');
  const { autoClockOutJob } = require('./src/services/cronJobs'); console.log('   ✅');

  console.log('\n✅ All good — server should start fine');
  console.log('\nTrying to start server on port 3000...');

  const app = express();
  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json());
  app.get('/test', (req, res) => res.json({ ok: true }));

  const server = app.listen(3000, '0.0.0.0', () => {
    console.log('✅ Server started on port 3000');
    server.close(() => {
      console.log('✅ Server closed cleanly');
      process.exit(0);
    });
  });

  server.on('error', (e) => {
    if (e.code === 'EADDRINUSE') {
      console.log('⚠️  Port 3000 is already in use — backend is already running!');
    } else {
      console.log('❌ Server error:', e.message);
    }
    process.exit(0);
  });

} catch(e) {
  console.log('\n❌ CRASH:', e.message);
  console.log(e.stack);
  process.exit(1);
}
