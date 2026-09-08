require('dotenv').config();
const bcrypt = require('bcryptjs');
const supabase = require('./src/config/supabase');

async function createAdmin() {
  const name     = 'Ephraim Agbaru';
  const email    = 'ephraimagbaru29@gmail.com';
  const password = 'Admin1234';

  // Check if already exists
  const { data: existing } = await supabase
    .from('admins')
    .select('id, email')
    .eq('email', email)
    .single();

  if (existing) {
    console.log('✅ Admin already exists:', existing.email);
    process.exit(0);
  }

  const hash = await bcrypt.hash(password, 12);
  const { data, error } = await supabase
    .from('admins')
    .insert({ name, email, password_hash: hash })
    .select('id, name, email')
    .single();

  if (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }

  console.log('✅ Admin created successfully!');
  console.log('   Name:', data.name);
  console.log('   Email:', data.email);
  console.log('   Password: Admin1234');
  console.log('\nYou can now log in at http://localhost:5173/admin/login');
  process.exit(0);
}

createAdmin();
