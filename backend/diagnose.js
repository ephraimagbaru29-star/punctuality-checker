require('dotenv').config();
const bcrypt = require('bcryptjs');
const supabase = require('./src/config/supabase');

async function diagnose() {
  console.log('\n========== PUNCTUALITY CHECKER DIAGNOSTICS ==========\n');

  // 1. Check Supabase connection
  console.log('1. Testing Supabase connection...');
  const { data: adminList, error: connErr } = await supabase
    .from('admins')
    .select('id, name, email, created_at');

  if (connErr) {
    console.log('   ❌ Supabase connection FAILED:', connErr.message);
    process.exit(1);
  }
  console.log('   ✅ Supabase connected successfully');

  // 2. Check admins
  console.log('\n2. Checking admin accounts...');
  if (!adminList || adminList.length === 0) {
    console.log('   ❌ NO ADMIN ACCOUNTS FOUND — need to create one');
  } else {
    console.log(`   ✅ Found ${adminList.length} admin(s):`);
    adminList.forEach(a => console.log(`      - ${a.name} | ${a.email}`));
  }

  // 3. Reset admin password to Admin1234
  console.log('\n3. Resetting admin password to Admin1234...');
  const hash = await bcrypt.hash('Admin1234', 12);
  const { error: resetErr } = await supabase
    .from('admins')
    .update({ password_hash: hash })
    .eq('email', 'ephraimagbaru29@gmail.com');

  if (resetErr) {
    console.log('   ❌ Password reset failed:', resetErr.message);
  } else {
    console.log('   ✅ Admin password reset to Admin1234');
  }

  // 4. Check students
  console.log('\n4. Checking student accounts...');
  const { data: students, error: stuErr } = await supabase
    .from('students')
    .select('id, full_name, email, clock_in_id, status');

  if (stuErr) {
    console.log('   ❌ Error fetching students:', stuErr.message);
  } else if (!students || students.length === 0) {
    console.log('   ℹ️  No students registered yet');
  } else {
    console.log(`   ✅ Found ${students.length} student(s):`);
    students.forEach(s =>
      console.log(`      - ${s.full_name} | ${s.email} | ID: ${s.clock_in_id} | Status: ${s.status}`)
    );
  }

  // 5. Check QR codes
  console.log('\n5. Checking QR codes...');
  const { data: qrs, error: qrErr } = await supabase
    .from('qr_codes')
    .select('id, label, token, is_active, expires_at');

  if (qrErr) {
    console.log('   ❌ Error fetching QR codes:', qrErr.message);
  } else if (!qrs || qrs.length === 0) {
    console.log('   ℹ️  No QR codes yet — generate one from the admin panel');
  } else {
    console.log(`   ✅ Found ${qrs.length} QR code(s):`);
    qrs.forEach(q =>
      console.log(`      - ${q.label} | Active: ${q.is_active} | Token: ${q.token.substring(0,16)}...`)
    );
  }

  // 6. Check attendance
  console.log('\n6. Checking attendance records...');
  const { count: attCount } = await supabase
    .from('attendance')
    .select('*', { count: 'exact', head: true });
  console.log(`   ✅ Total attendance records: ${attCount || 0}`);

  console.log('\n========== SUMMARY ==========');
  console.log('Admin login URL : http://localhost:5173/admin/login');
  console.log('Admin email     : ephraimagbaru29@gmail.com');
  console.log('Admin password  : Admin1234');
  console.log('Student login   : http://localhost:5173/login');
  console.log('==============================\n');

  process.exit(0);
}

diagnose().catch(err => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
