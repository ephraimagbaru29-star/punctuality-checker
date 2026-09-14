require('dotenv').config();
const bcrypt = require('bcryptjs');
const supabase = require('./src/config/supabase');

async function testLogin() {
  console.log('\n========== LOGIN TEST ==========\n');

  // 1. Find admin
  console.log('Looking up admin account...');
  const { data: admin, error } = await supabase
    .from('admins')
    .select('*')
    .eq('email', 'ephraimagbaru29@gmail.com')
    .single();

  if (error || !admin) {
    console.log('❌ Admin not found! Creating one now...');
    const hash = await bcrypt.hash('Admin1234', 12);
    const { data: newAdmin, error: createErr } = await supabase
      .from('admins')
      .insert({ name: 'Ephraim Agbaru', email: 'ephraimagbaru29@gmail.com', password_hash: hash })
      .select()
      .single();
    if (createErr) {
      console.log('❌ Failed to create admin:', createErr.message);
      process.exit(1);
    }
    console.log('✅ Admin created!');
    console.log('Email   :', newAdmin.email);
    console.log('Password: Admin1234');
    process.exit(0);
  }

  console.log('✅ Admin found:', admin.email);

  // 2. Test password
  console.log('\nTesting password "Admin1234"...');
  const valid = await bcrypt.compare('Admin1234', admin.password_hash);
  if (valid) {
    console.log('✅ Password is CORRECT');
    console.log('\n--- LOGIN DETAILS ---');
    console.log('URL     : http://localhost:5173/admin/login');
    console.log('Email   : ephraimagbaru29@gmail.com');
    console.log('Password: Admin1234');
    console.log('---------------------');
  } else {
    console.log('❌ Password is WRONG — resetting to Admin1234...');
    const newHash = await bcrypt.hash('Admin1234', 12);
    await supabase
      .from('admins')
      .update({ password_hash: newHash })
      .eq('email', 'ephraimagbaru29@gmail.com');
    console.log('✅ Password reset to Admin1234');
    console.log('\n--- LOGIN DETAILS ---');
    console.log('URL     : http://localhost:5173/admin/login');
    console.log('Email   : ephraimagbaru29@gmail.com');
    console.log('Password: Admin1234');
    console.log('---------------------');
  }

  // 3. Check students
  console.log('\nChecking students...');
  const { data: students } = await supabase
    .from('students')
    .select('full_name, email, clock_in_id, status');

  if (!students || students.length === 0) {
    console.log('ℹ️  No students yet');
  } else {
    students.forEach(s => {
      console.log(`  - ${s.full_name} | ID: ${s.clock_in_id} | Status: ${s.status}`);
    });
  }

  process.exit(0);
}

testLogin().catch(e => {
  console.error('Fatal:', e.message);
  process.exit(1);
});
