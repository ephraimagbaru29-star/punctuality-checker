require('dotenv').config();
const bcrypt = require('bcryptjs');
const supabase = require('./src/config/supabase');

async function reset() {
  const email = 'ephraimagbaru29@gmail.com';
  const newPassword = 'Punctuality2026';

  const hash = await bcrypt.hash(newPassword, 12);
  
  const { data, error } = await supabase
    .from('admins')
    .update({ password_hash: hash })
    .eq('email', email)
    .select('email')
    .single();

  if (error) {
    console.log('❌ Error:', error.message);
  } else {
    console.log('✅ Password reset successfully!');
    console.log('Email   :', email);
    console.log('Password: Punctuality2026');
  }
  process.exit(0);
}

reset();
