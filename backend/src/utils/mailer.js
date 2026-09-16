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

// Sent when student registers — includes their Clock-In ID
const sendRegistrationEmail = async (email, name, clockInId) => {
  await sendMail({
    to: email,
    subject: 'Punctuality Checker — Registration Received',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #1a1a2e; padding: 30px; text-align: center;">
          <h1 style="color: #e94560; margin: 0;">Punctuality Checker</h1>
        </div>
        <div style="padding: 30px; background: #f9f9f9;">
          <h2 style="color: #1a1a2e;">Registration Received!</h2>
          <p>Hi <strong>${name}</strong>,</p>
          <p>Your registration has been received and is <strong>pending admin approval</strong>.</p>
          <p>Your unique <strong>Clock-In ID</strong> is:</p>
          <div style="background: #1a1a2e; color: #e94560; font-size: 28px; font-weight: bold;
            letter-spacing: 6px; text-align: center; padding: 20px; border-radius: 10px; margin: 20px 0;">
            ${clockInId}
          </div>
          <p style="color: #555;">Save this ID — you will need it to log in once your account is approved by the admin.</p>
          <p style="color: #888; font-size: 13px; margin-top: 20px;">
            If you did not register for Punctuality Checker, please ignore this email.
          </p>
        </div>
        <div style="background: #1a1a2e; padding: 15px; text-align: center;">
          <p style="color: #888; font-size: 12px; margin: 0;">© 2026 Punctuality Checker. All rights reserved.</p>
        </div>
      </div>
    `
  });
};

// Sent when admin approves a student
const sendApprovalEmail = async (email, name, clockInId) => {
  await sendMail({
    to: email,
    subject: 'Punctuality Checker — Account Approved!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #1a1a2e; padding: 30px; text-align: center;">
          <h1 style="color: #e94560; margin: 0;">Punctuality Checker</h1>
        </div>
        <div style="padding: 30px; background: #f9f9f9;">
          <h2 style="color: #22c55e;">✅ Account Approved!</h2>
          <p>Hi <strong>${name}</strong>,</p>
          <p>Your account has been <strong>approved</strong> by the admin. You can now log in!</p>
          <p>Your <strong>Clock-In ID</strong> is:</p>
          <div style="background: #1a1a2e; color: #e94560; font-size: 28px; font-weight: bold;
            letter-spacing: 6px; text-align: center; padding: 20px; border-radius: 10px; margin: 20px 0;">
            ${clockInId}
          </div>
          <p style="color: #555;">Use this ID along with your password to log in to the Student Portal.</p>
        </div>
        <div style="background: #1a1a2e; padding: 15px; text-align: center;">
          <p style="color: #888; font-size: 12px; margin: 0;">© 2026 Punctuality Checker. All rights reserved.</p>
        </div>
      </div>
    `
  });
};

// Sent when admin unsuspends a student
const sendUnsuspendEmail = async (email, name) => {
  await sendMail({
    to: email,
    subject: 'Punctuality Checker — Account Reactivated',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #1a1a2e; padding: 30px; text-align: center;">
          <h1 style="color: #e94560; margin: 0;">Punctuality Checker</h1>
        </div>
        <div style="padding: 30px; background: #f9f9f9;">
          <h2 style="color: #22c55e;">✅ Account Reactivated</h2>
          <p>Hi <strong>${name}</strong>,</p>
          <p>Your account suspension has been lifted. You can now log in and clock in normally.</p>
        </div>
        <div style="background: #1a1a2e; padding: 15px; text-align: center;">
          <p style="color: #888; font-size: 12px; margin: 0;">© 2026 Punctuality Checker. All rights reserved.</p>
        </div>
      </div>
    `
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
          <p>Your device reset request has been approved. Click the button below to clear your old device and log in from your new device.</p>
          <p style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}"
               style="background: #e94560; color: white; padding: 14px 28px; border-radius: 8px;
               text-decoration: none; font-size: 16px; font-weight: bold;">
              Reset My Device
            </a>
          </p>
          <p style="color: #888; font-size: 13px;">This link expires in 1 hour.</p>
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
          <p style="color: #888; font-size: 13px;">If you don't clock out within 30 minutes, the system will automatically clock you out and mark you absent.</p>
        </div>
        <div style="background: #1a1a2e; padding: 15px; text-align: center;">
          <p style="color: #888; font-size: 12px; margin: 0;">© 2026 Punctuality Checker. All rights reserved.</p>
        </div>
      </div>
    `
  });
};

module.exports = {
  sendMail,
  sendRegistrationEmail,
  sendApprovalEmail,
  sendUnsuspendEmail,
  sendDeviceResetEmail,
  sendClockOutReminderEmail
};
