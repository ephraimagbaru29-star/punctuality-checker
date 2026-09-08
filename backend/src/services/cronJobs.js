const supabase = require('../config/supabase');
const { sendClockOutReminderEmail } = require('../utils/mailer');

/**
 * Auto clock-out job — runs at 5:30 PM
 * Any student who clocked in but didn't clock out gets auto-clocked-out
 * and marked absent (as per spec: 30 min after 5pm)
 */
const autoClockOutJob = async () => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const now = new Date().toISOString();

    // Find all attendance records for today where clocked in but NOT clocked out
    const { data: unclockedOut, error } = await supabase
      .from('attendance')
      .select('id, student_id, clock_in_time')
      .eq('date', today)
      .not('clock_in_time', 'is', null)
      .is('clock_out_time', null);

    if (error) {
      console.error('[CRON] Error fetching unclosed attendance:', error);
      return;
    }

    if (!unclockedOut || unclockedOut.length === 0) {
      console.log('[CRON] No students need auto clock-out today.');
      return;
    }

    console.log(`[CRON] Auto clocking out ${unclockedOut.length} student(s)...`);

    // Update each record
    const ids = unclockedOut.map((r) => r.id);
    const { error: updateError } = await supabase
      .from('attendance')
      .update({
        clock_out_time: now,
        status: 'absent',          // marked absent for not clocking out
        auto_clocked_out: true,
        clock_out_reason: 'auto_system'
      })
      .in('id', ids);

    if (updateError) {
      console.error('[CRON] Error updating attendance:', updateError);
      return;
    }

    // Send in-app notification to each affected student
    const notifications = unclockedOut.map((r) => ({
      student_id: r.student_id,
      message: 'You were automatically clocked out at 5:30 PM and marked absent because you did not clock out.',
      type: 'warning'
    }));

    await supabase.from('notifications').insert(notifications);

    console.log(`[CRON] Auto clock-out complete for ${ids.length} student(s).`);
  } catch (err) {
    console.error('[CRON] autoClockOutJob error:', err);
  }
};

/**
 * Reminder job — runs at 5:05 PM
 * Send reminder to students who are still clocked in (haven't clocked out yet)
 */
const sendClockOutReminders = async () => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const { data: stillClockedIn, error } = await supabase
      .from('attendance')
      .select('student_id, students(full_name, email)')
      .eq('date', today)
      .not('clock_in_time', 'is', null)
      .is('clock_out_time', null);

    if (error) {
      console.error('[CRON] Error fetching still-clocked-in students:', error);
      return;
    }

    if (!stillClockedIn || stillClockedIn.length === 0) {
      console.log('[CRON] No students need clock-out reminder.');
      return;
    }

    console.log(`[CRON] Sending reminders to ${stillClockedIn.length} student(s)...`);

    for (const record of stillClockedIn) {
      const student = record.students;
      if (!student) continue;

      // In-app notification
      await supabase.from('notifications').insert({
        student_id: record.student_id,
        message: '⏰ Reminder: It\'s past 5:00 PM. Please clock out now. You will be automatically clocked out and marked absent at 5:30 PM.',
        type: 'reminder'
      });

      // Email reminder
      try {
        await sendClockOutReminderEmail(student.email, student.full_name);
      } catch (emailErr) {
        console.error(`[CRON] Failed to send email to ${student.email}:`, emailErr.message);
      }
    }

    console.log('[CRON] Reminder job complete.');
  } catch (err) {
    console.error('[CRON] sendClockOutReminders error:', err);
  }
};

module.exports = { autoClockOutJob, sendClockOutReminders };
