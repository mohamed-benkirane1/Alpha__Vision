const router = require('express').Router();
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const auth = require('../middleware/auth');
const passport = require('../config/passport');
const { isSmtpConfigured, sendPasswordResetEmail } = require('../services/emailService');

const PROFILE_FIELDS = ['name'];
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RESET_TOKEN_BYTES = 32;
const DEFAULT_RESET_PASSWORD_EXPIRES_MINUTES = 15;

function nowIso() {
  return new Date().toISOString();
}

function getFrontendUrl() {
  return (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');
}

function getResetPasswordExpiresMinutes() {
  const configured = Number(process.env.RESET_PASSWORD_EXPIRES_MINUTES);
  return Number.isFinite(configured) && configured > 0
    ? configured
    : DEFAULT_RESET_PASSWORD_EXPIRES_MINUTES;
}

function isEmail(value) {
  return EMAIL_PATTERN.test(value);
}

function serializeUser(user) {
  if (!user) return null;

  const balance = Number(user.balance);

  return {
    id: String(user._id || user.id),
    name: user.name || '',
    email: user.email || '',
    role: user.role || null,
    plan: user.plan || 'free',
    balance: Number.isFinite(balance) ? balance : 0,
    planExpiresAt: user.planExpiresAt || null,
    createdAt: user.createdAt || null,
    updatedAt: user.updatedAt || null,
  };
}

function userResponse(user, extras = {}) {
  return {
    success: true,
    timestamp: nowIso(),
    user: serializeUser(user),
    warnings: [],
    error: null,
    ...extras,
  };
}

function errorResponse(error, extras = {}) {
  return {
    success: false,
    timestamp: nowIso(),
    user: null,
    warnings: [],
    error,
    ...extras,
  };
}

function authActionResponse(extras = {}) {
  return {
    success: true,
    timestamp: nowIso(),
    warnings: [],
    error: null,
    ...extras,
  };
}

function authActionError(error, extras = {}) {
  return {
    success: false,
    timestamp: nowIso(),
    warnings: [],
    error,
    ...extras,
  };
}

function hashResetToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function buildResetUrl(email, token) {
  const url = new URL('/reset-password', getFrontendUrl());
  url.searchParams.set('token', token);
  url.searchParams.set('email', email);
  return url.toString();
}

function validateResetPassword(password) {
  if (typeof password !== 'string' || password.length < 8) {
    return 'newPassword must be at least 8 characters.';
  }
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    return 'newPassword must include at least one letter and one number.';
  }
  return null;
}

function devResetUrlExtras(resetUrl) {
  const devResponseEnabled = process.env.NODE_ENV !== 'production'
    && process.env.ENABLE_DEV_RESET_TOKEN_RESPONSE === 'true';

  if (!devResponseEnabled || !resetUrl) return {};

  return {
    devResetUrl: resetUrl,
    warnings: ['Development reset URL response is enabled. Disable it outside local development.'],
  };
}

function requireGoogleOAuth(req, res, next) {
  if (passport.googleOAuthConfigured) return next();

  return res.status(503).json(authActionError('Google OAuth is not configured on the backend.', {
    provider: 'google',
  }));
}

router.post('/signup', async (req, res) => {
  try {
    const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
    const email = typeof req.body?.email === 'string' ? req.body.email.trim() : '';
    const password = typeof req.body?.password === 'string' ? req.body.password : '';

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'All fields required' });
    }

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Email already used' });

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashed });
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    return res.status(201).json({ token, user: serializeUser(user) });
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Unable to create account' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const email = typeof req.body?.email === 'string' ? req.body.email.trim() : '';
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    return res.json({ token, user: serializeUser(user) });
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Unable to sign in' });
  }
});

router.post('/forgot-password', async (req, res) => {
  try {
    const email = typeof req.body?.email === 'string' ? req.body.email.trim() : '';
    if (!isEmail(email)) {
      return res.status(400).json(authActionError('A valid email is required.'));
    }

    const providerConfigured = isSmtpConfigured();
    const expiresMinutes = getResetPasswordExpiresMinutes();
    const warnings = [];
    let emailSent = providerConfigured;
    let resetUrl = null;

    const user = await User.findOne({ email });
    if (user) {
      const resetToken = crypto.randomBytes(RESET_TOKEN_BYTES).toString('hex');
      user.resetPasswordTokenHash = hashResetToken(resetToken);
      user.resetPasswordExpires = new Date(Date.now() + expiresMinutes * 60 * 1000);
      user.updatedAt = new Date();
      await user.save();

      resetUrl = buildResetUrl(email, resetToken);

      if (providerConfigured) {
        try {
          const result = await sendPasswordResetEmail({
            to: email,
            resetUrl,
            expiresMinutes,
          });
          emailSent = result.emailSent === true;
          warnings.push(...(result.warnings || []));
        } catch {
          emailSent = false;
          warnings.push('Configured SMTP provider could not send the password reset email.');
        }
      }
    }

    if (!providerConfigured) {
      emailSent = false;
      warnings.push('SMTP email provider is not configured. No password reset email was sent.');
    }

    const devExtras = user ? devResetUrlExtras(resetUrl) : {};

    return res.json(authActionResponse({
      message: emailSent
        ? 'If an account exists for this email, a password reset link has been sent.'
        : 'Password reset request accepted, but no email was sent because the email provider is unavailable.',
      emailSent,
      providerConfigured,
      expiresMinutes,
      warnings: [...warnings, ...(devExtras.warnings || [])],
      ...(devExtras.devResetUrl ? { devResetUrl: devExtras.devResetUrl } : {}),
    }));
  } catch (err) {
    return res.status(500).json(authActionError(err.message || 'Unable to create password reset request.'));
  }
});

router.post('/reset-password', async (req, res) => {
  try {
    const email = typeof req.body?.email === 'string' ? req.body.email.trim() : '';
    const token = typeof req.body?.token === 'string' ? req.body.token.trim() : '';
    const newPassword = typeof req.body?.newPassword === 'string' ? req.body.newPassword : '';
    const passwordError = validateResetPassword(newPassword);

    if (!isEmail(email)) {
      return res.status(400).json(authActionError('A valid email is required.'));
    }
    if (!token) {
      return res.status(400).json(authActionError('Reset token is required.'));
    }
    if (passwordError) {
      return res.status(400).json(authActionError(passwordError));
    }

    const tokenHash = hashResetToken(token);
    const user = await User.findOne({
      email,
      resetPasswordTokenHash: tokenHash,
      resetPasswordExpires: { $gt: new Date() },
    }).select('+resetPasswordTokenHash +resetPasswordExpires');

    if (!user) {
      return res.status(400).json(authActionError('Reset token is invalid or expired.'));
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.resetPasswordTokenHash = null;
    user.resetPasswordExpires = null;
    user.updatedAt = new Date();
    await user.save();

    return res.json(authActionResponse({
      message: 'Password reset successfully.',
    }));
  } catch (err) {
    return res.status(500).json(authActionError(err.message || 'Unable to reset password.'));
  }
});

router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('name email balance plan planExpiresAt createdAt updatedAt');

    if (!user) {
      return res.status(404).json(errorResponse('User not found'));
    }

    return res.json(userResponse(user));
  } catch (err) {
    return res.status(500).json(errorResponse(err.message || 'Unable to load current user'));
  }
});

router.patch('/profile', auth, async (req, res) => {
  try {
    const fields = Object.keys(req.body || {});
    const unsupported = fields.filter((field) => !PROFILE_FIELDS.includes(field));

    if (unsupported.length > 0) {
      return res.status(400).json(errorResponse(`Unsupported profile fields: ${unsupported.join(', ')}`));
    }

    const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
    if (!name) {
      return res.status(400).json(errorResponse('name is required'));
    }
    if (name.length < 2 || name.length > 80) {
      return res.status(400).json(errorResponse('name must be between 2 and 80 characters'));
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json(errorResponse('User not found'));
    }

    user.name = name;
    user.updatedAt = new Date();
    await user.save();

    return res.json(userResponse(user, {
      message: 'Profile updated successfully',
    }));
  } catch (err) {
    return res.status(500).json(errorResponse(err.message || 'Unable to update profile'));
  }
});

router.get('/google',
  requireGoogleOAuth,
  passport.authenticate('google', { scope: ['profile', 'email'], session: false }),
);

router.get('/google/callback',
  requireGoogleOAuth,
  passport.authenticate('google', {
    session: false,
    failureRedirect: `${getFrontendUrl()}/login?oauth=failed`,
  }),
  (req, res) => {
    const token = jwt.sign({ id: req.user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.redirect(`${getFrontendUrl()}/auth/callback?token=${encodeURIComponent(token)}`);
  },
);

module.exports = router;
