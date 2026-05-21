const nodemailer = require('nodemailer');

function parseBoolean(value) {
  return String(value || '').trim().toLowerCase() === 'true';
}

function getSmtpConfig() {
  const host = process.env.SMTP_HOST || '';
  const port = Number(process.env.SMTP_PORT);
  const secure = parseBoolean(process.env.SMTP_SECURE);
  const user = process.env.SMTP_USER || '';
  const pass = process.env.SMTP_PASS || '';
  const from = process.env.EMAIL_FROM || '';
  const configured = Boolean(host && Number.isFinite(port) && port > 0 && user && pass && from);

  return {
    configured,
    host,
    port,
    secure,
    user,
    pass,
    from,
  };
}

function isSmtpConfigured() {
  return getSmtpConfig().configured;
}

async function sendPasswordResetEmail({ to, resetUrl, expiresMinutes }) {
  const config = getSmtpConfig();

  if (!config.configured) {
    return {
      emailSent: false,
      providerConfigured: false,
      warnings: ['SMTP email provider is not configured. No password reset email was sent.'],
    };
  }

  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.pass,
    },
  });

  await transporter.sendMail({
    from: config.from,
    to,
    subject: 'Reset your Alpha Vision password',
    text: [
      'A password reset was requested for your Alpha Vision account.',
      `Open this link within ${expiresMinutes} minutes to set a new password:`,
      resetUrl,
      'If you did not request this reset, you can ignore this email.',
    ].join('\n\n'),
    html: [
      '<p>A password reset was requested for your Alpha Vision account.</p>',
      `<p>Open this link within ${expiresMinutes} minutes to set a new password:</p>`,
      `<p><a href="${resetUrl}">Reset password</a></p>`,
      '<p>If you did not request this reset, you can ignore this email.</p>',
    ].join(''),
  });

  return {
    emailSent: true,
    providerConfigured: true,
    warnings: [],
  };
}

module.exports = {
  getSmtpConfig,
  isSmtpConfigured,
  sendPasswordResetEmail,
};
