const http = require('http');
const open = require('open');
const { google } = require('googleapis');
require('dotenv').config();

// Use the same Gmail OAuth2 credentials as Mailer.js and your backend
const CLIENT_ID = process.env.GMAIL_CLIENT_ID;
const CLIENT_SECRET = process.env.GMAIL_CLIENT_SECRET;
const REDIRECT_URI = 'http://localhost:3000/oauth2callback';
const PORT = 3000;

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('Please set GMAIL_CLIENT_ID and GMAIL_CLIENT_SECRET in your .env file before running.');
  process.exit(1);
}

const oAuth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
const scopes = ['https://www.googleapis.com/auth/gmail.send'];

const authUrl = oAuth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: scopes,
  prompt: 'consent',
});

const server = http.createServer(async (req, res) => {
  if (!req.url.startsWith('/oauth2callback')) return res.end('Invalid endpoint');

  const url = new URL(req.url, `http://localhost:${PORT}`);
  const code = url.searchParams.get('code');
  if (!code) {
    res.end('No code in query');
    console.error('No code returned in callback');
    server.close();
    return;
  }

  try {
    const { tokens } = await oAuth2Client.getToken(code);
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Success! You can close this tab. Check the terminal for the refresh token.');
    console.log('Tokens received:');
    console.log(JSON.stringify(tokens, null, 2));
    console.log('\nCopy the refresh_token value into your .env file as GMAIL_REFRESH_TOKEN.');
    console.log('Example .env setup for Mailer.js, server.js, and Forgotpassword.js integration:');
    console.log('GMAIL_CLIENT_ID=' + CLIENT_ID);
    console.log('GMAIL_CLIENT_SECRET=' + CLIENT_SECRET);
    console.log('GMAIL_REFRESH_TOKEN=' + tokens.refresh_token);
    console.log('EMAIL_FROM=your_gmail_address@gmail.com');
    console.log('AUDIT_EMAIL=tenantmaintenanceportal@gmail.com');
    console.log('\nAfter updating .env, restart your backend to use Gmail API for OTP emails.');
  } catch (err) {
    console.error('Failed to exchange code for tokens:', err);
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Failed to exchange code for tokens. See terminal.');
  } finally {
    server.close();
  }
});

server.listen(PORT, () => {
  console.log(`Open this URL in your browser to grant access:\n\n${authUrl}\n`);
  (async () => {
    try { await open(authUrl); } catch (_) { }
  })();
});
