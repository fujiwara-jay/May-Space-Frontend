const { google } = require('googleapis');
const nodemailer = require('nodemailer');
require('dotenv').config();
const FROM_EMAIL = process.env.EMAIL_FROM || process.env.SMTP_USER || '';
const AUDIT_EMAIL = process.env.AUDIT_EMAIL || 'mayspaceunitfinder@gmail.com';

if (!FROM_EMAIL) {
  console.warn('[mailer] WARNING: EMAIL_FROM or SMTP_USER is not set. Please set EMAIL_FROM to your Gmail address (the account authorized by GMAIL_REFRESH_TOKEN) to send emails.');
} else {
  console.log(`[mailer] configured FROM_EMAIL=${FROM_EMAIL}, AUDIT_EMAIL=${AUDIT_EMAIL}`);
}

const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;

async function sendViaGmail(recipients, subject, html) {
  const clientId = process.env.GMAIL_CLIENT_ID;
  const clientSecret = process.env.GMAIL_CLIENT_SECRET;
  const refreshToken = process.env.GMAIL_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error('Gmail OAuth2 credentials are not fully configured');
  }

  const oAuth2Client = new google.auth.OAuth2(clientId, clientSecret);
  oAuth2Client.setCredentials({ refresh_token: refreshToken });

  try {
    await oAuth2Client.getAccessToken();
  } catch (err) {
    console.error('[mailer] Failed to obtain Gmail access token via OAuth2:', err);
    throw err;
  }

  const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });

  for (const recipient of recipients) {
    try {
      console.log(`[mailer] Sending OTP via Gmail API to=${recipient} from=${FROM_EMAIL}`);

      const messageLines = [];
      messageLines.push(`From: ${FROM_EMAIL}`);
      messageLines.push(`To: ${recipient}`);
      messageLines.push(`Subject: ${subject}`);
      messageLines.push('MIME-Version: 1.0');
      messageLines.push('Content-Type: text/html; charset=UTF-8');
      messageLines.push('');
      messageLines.push(html);

      const message = messageLines.join('\r\n');
      const encodedMessage = Buffer.from(message)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      const res = await gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: encodedMessage,
        },
      });

      console.log(`[mailer] Gmail API send response for ${recipient}:`, res && res.data && res.data.id ? res.data.id : res);
    } catch (err) {
      console.error(`[mailer] Gmail API send failed for ${recipient}:`, err && err.message ? err.message : err);
    }
  }
}

async function sendOtpEmail(to, otp) {
  if (!to) throw new Error('Missing recipient `to` for sendOtpEmail');

  const subject = 'Your OTP Code';
  const html = `<p>OTP for <strong>${to}</strong>: <strong>${otp}</strong></p>`;

  const recipients = [to];
  if (AUDIT_EMAIL && AUDIT_EMAIL !== to) recipients.push(AUDIT_EMAIL);

  if (process.env.GMAIL_CLIENT_ID && process.env.GMAIL_CLIENT_SECRET && process.env.GMAIL_REFRESH_TOKEN) {
    await sendViaGmail(recipients, subject, html);
    return;
  }

  if (SMTP_USER && SMTP_PASS) {
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '465', 10),
        secure: (process.env.SMTP_SECURE || 'true') === 'true',
        auth: {
          user: SMTP_USER,
          pass: SMTP_PASS,
        },
      });

      for (const recipient of recipients) {
        try {
          console.log(`[mailer] Sending OTP via SMTP to=${recipient} from=${FROM_EMAIL}`);
          const info = await transporter.sendMail({ from: FROM_EMAIL, to: recipient, subject, html });
          console.log(`[mailer] SMTP send response for ${recipient}:`, info && info.messageId ? info.messageId : info);
        } catch (err) {
          console.error(`[mailer] SMTP send failed for ${recipient}:`, err && err.message ? err.message : err);
        }
      }
      return;
    } catch (err) {
      console.error('[mailer] Failed to create SMTP transporter:', err);
    }
  }
  console.warn('No email provider configured — logging OTP instead of sending');
  console.log(`OTP for ${to}: ${otp}`);
  console.log(`Audit: ${AUDIT_EMAIL}`);
}

module.exports = { sendOtpEmail };
