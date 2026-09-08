const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

const sendMail = async ({ to, subject, html }) => {
  return transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject,
    html
  });
};

const sendDeviceResetEmail = async (email, name, resetLink) => {
  await sendMail({
    to: email,
    subject: 'Punctuality Checker — Device Reset Request Approved',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #1a1a2e; padding: 30px; text-align: center;">
          <h1 style="color: #e94560; margin: 0;">Punctuality Checker</h1>
        </div>
        <div style="padding: 30px; background: #f9f9f9;">
          <h2 style="color: #1a1a2e;">Device Reset Approved</h2>
          <p>Hi <strong>${name}</strong>,</p>
          <p>Your device reset request has been approved. Click the button below to clear your old device data and log in with your new device.</p>
          <p style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" 
               style="background: #e94560; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-size: 16px; font-weight: bold;">
              Reset My Device
            </a>
          </p>
          <p style="color: #888; font-size: 13px;">This link expires in 1 hour. If you did not request this, please ignore this email.</p>
        </div>
        <div style="background: #1a1a2e; padding: 15px; text-align: center;">
          <p style="color: #888; font-size: 12px; margin: 0;">© 2026 Punctuality Checker. All rights reserved.</p>
        </div>
      </div>
    `
  });
};

const sendClockOutReminderEmail = async (email, name) => {
  await sendMail({
    to: email,
    subject: 'Punctuality Checker — Clock-Out Reminder',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #1a1a2e; padding: 30px; text-align: center;">
          <h1 style="color: #e94560; margin: 0;">Punctuality Checker</h1>
        </div>
        <div style="padding: 30px; background: #f9f9f9;">
          <h2 style="color: #e94560;">⏰ Reminder: Clock Out Now</h2>
          <p>Hi <strong>${name}</strong>,</p>
          <p>It's past 5:00 PM and you haven't clocked out yet. Please log in and clock out to avoid being marked absent.</p>
          <p style="color: #888; font-size: 13px;">If you don't clock out within 30 minutes of the close of business hour, the system will automatically clock you out and mark you absent.</p>
        </div>
        <div style="background: #1a1a2e; padding: 15px; text-align: center;">
          <p style="color: #888; font-size: 12px; margin: 0;">© 2026 Punctuality Checker. All rights reserved.</p>
        </div>
      </div>
    `
  });
};

module.exports = { sendMail, sendDeviceResetEmail, sendClockOutReminderEmail };
