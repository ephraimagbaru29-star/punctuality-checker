require('dotenv').config();
const supabase = require('./src/config/supabase');

async function clearAllDevices() {
  console.log('\nClearing all locked devices...');

  const { data, error } = await supabase
    .from('student_devices')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // delete all

  if (error) {
    console.log('❌ Error:', error.message);
  } else {
    console.log('✅ All device locks cleared!');
    console.log('Students can now log in from any device.');
    console.log('Their device will be re-locked on next login.');
  }

  process.exit(0);
}

clearAllDevices();
