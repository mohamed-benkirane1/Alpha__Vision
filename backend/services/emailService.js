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

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
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

  const safeResetUrl = escapeHtml(resetUrl);
  const safeExpiresMinutes = Number.isFinite(Number(expiresMinutes)) ? Number(expiresMinutes) : 15;

  await transporter.sendMail({
    from: config.from,
    to,
    subject: 'Reset your Alpha Vision password',
    text: [
      'A password reset was requested for your Alpha Vision account.',
      `Open this link within ${safeExpiresMinutes} minutes to set a new password:`,
      resetUrl,
      'If you did not request this reset, you can ignore this email.',
    ].join('\n\n'),
    html: [
      '<div style="font-family:Arial,sans-serif;line-height:1.5;color:#111827">',
      '<h2 style="margin:0 0 12px">Reset your Alpha Vision password</h2>',
      '<p>A password reset was requested for your Alpha Vision account.</p>',
      `<p>Open this link within ${safeExpiresMinutes} minutes to set a new password:</p>`,
      `<p style="margin:24px 0"><a href="${safeResetUrl}" style="background:#e11d48;color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:8px;font-weight:700;display:inline-block">Reset password</a></p>`,
      `<p style="word-break:break-all;color:#4b5563;font-size:12px">${safeResetUrl}</p>`,
      '<p>If you did not request this reset, you can ignore this email.</p>',
      '</div>',
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
