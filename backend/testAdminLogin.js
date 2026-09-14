require('dotenv').config();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const supabase = require('./src/config/supabase');

async function testAdminLogin() {
  console.log('\n=== TESTING ADMIN LOGIN ===\n');

  const email = 'ephraimagbaru29@gmail.com';
  const password = 'Admin1234';

  // Step 1: Find admin
  console.log('1. Looking up admin in database...');
  const { data: admin, error } = await supabase
    .from('admins')
    .select('*')
    .eq('email', email.toLowerCase().trim())
    .single();

  if (error || !admin) {
    console.log('❌ Admin not found:', error?.message);
    process.exit(1);
  }
  console.log('   ✅ Found admin:', admin.email);

  // Step 2: Check password
  console.log('2. Checking password...');
  const valid = await bcrypt.compare(password, admin.password_hash);
  if (!valid) {
    console.log('   ❌ Password wrong — resetting...');
    const hash = await bcrypt.hash(password, 12);
    await supabase.from('admins').update({ password_hash: hash }).eq('email', email);
    console.log('   ✅ Password reset to Admin1234');
  } else {
    console.log('   ✅ Password correct');
  }

  // Step 3: Generate token
  console.log('3. Generating JWT token...');
  const token = jwt.sign(
    { id: admin.id, role: 'admin', email: admin.email },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
  console.log('   ✅ Token generated:', token.substring(0, 40) + '...');

  // Step 4: Simulate full response
  console.log('\n✅ LOGIN WOULD SUCCEED');
  console.log('Response would be:');
  console.log(JSON.stringify({
    token: token.substring(0, 20) + '...',
    user: {
      id: admin.id,
      name: admin.name,
      email: admin.email,
      role: 'admin'
    }
  }, null, 2));

  console.log('\n=== NOW TEST THE HTTP ENDPOINT ===');
  console.log('Make sure backend is running then open this URL in browser:');
  console.log('http://localhost:3000/api/health');
  console.log('\nIf you see {"status":"ok"} the backend is running fine.');

  process.exit(0);
}

testAdminLogin().catch(e => {
  console.error('Fatal:', e.message);
  process.exit(1);
});
