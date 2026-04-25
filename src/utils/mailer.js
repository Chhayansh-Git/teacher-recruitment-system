/**
 * src/utils/mailer.js
 * Handles sending emails using Nodemailer.
 */

const nodemailer = require('nodemailer');
const logger = require('./logger');

// Create a transporter using SMTP
// For production, these should be securely stored in .env
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Send temporary credentials to a registered school.
 * @param {string} email - The school's email address.
 * @param {string} tempPassword - The auto-generated temporary password.
 */
async function sendSchoolCredentials(email, tempPassword) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    logger.warn('SMTP credentials not configured. Skipping email send for: ' + email);
    logger.info('Temporary password for ' + email + ' is: ' + tempPassword);
    return;
  }

  try {
    const info = await transporter.sendMail({
      from: `"Edvance Admin" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: email,
      subject: 'Your Edvance School Portal Credentials',
      text: `Welcome to Edvance!
      
Your school account has been successfully verified.
Please use the following temporary password to log in:

Temporary Password: ${tempPassword}

You will be required to change this password immediately upon your first login.

Thank you,
The Edvance Team`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Welcome to Edvance!</h2>
          <p>Your school account has been successfully verified.</p>
          <p>Please use the following temporary password to log in:</p>
          <div style="background: #f1f5f9; padding: 16px; border-radius: 8px; font-size: 1.2rem; font-family: monospace; font-weight: bold; text-align: center; letter-spacing: 2px;">
            ${tempPassword}
          </div>
          <p style="margin-top: 24px;"><strong>Note:</strong> You will be required to change this password immediately upon your first login.</p>
          <p>Thank you,<br/>The Edvance Team</p>
        </div>
      `,
    });

    logger.info(`Credentials email sent to ${logger.maskEmail(email)}: ${info.messageId}`);
  } catch (error) {
    logger.error(`Failed to send credentials email to ${email}: ${error.message}`);
  }
}

module.exports = {
  sendSchoolCredentials,
};
