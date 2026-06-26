const router = require('express').Router();
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
const PASSWORD_RESET_PUBLIC_MESSAGE = 'If an account exists for this email, a password reset link has been sent.';
const VALID_COOKIE_SAME_SITE_VALUES = new Set(['strict', 'lax', 'none']);

// Env constants — read once at startup, never inside request handlers
const FRONTEND_URL = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');
const RESET_EXPIRES_MINUTES = (() => {
  const configured = Number(process.env.RESET_PASSWORD_EXPIRES_MINUTES);
  return Number.isFinite(configured) && configured > 0 ? configured : DEFAULT_RESET_PASSWORD_EXPIRES_MINUTES;
})();
const IS_PRODUCTION = String(process.env.NODE_ENV || 'development').trim().toLowerCase() === 'production';
const AUTH_COOKIE_SAMESITE_RAW = String(process.env.AUTH_COOKIE_SAME_SITE || '').trim().toLowerCase();
const ENABLE_DEV_RESET_TOKEN = !IS_PRODUCTION && String(process.env.ENABLE_DEV_RESET_TOKEN_RESPONSE || '').trim().toLowerCase() === 'true';

function nowIso() {
  return new Date().toISOString();
}

function getFrontendUrl() {
  return FRONTEND_URL;
}

function getResetPasswordExpiresMinutes() {
  return RESET_EXPIRES_MINUTES;
}

function isProduction() {
  return IS_PRODUCTION;
}

function getAuthCookieSameSite() {
  if (VALID_COOKIE_SAME_SITE_VALUES.has(AUTH_COOKIE_SAMESITE_RAW)) return AUTH_COOKIE_SAMESITE_RAW;
  return IS_PRODUCTION ? 'strict' : 'lax';
}

function getAuthCookieOptions() {
  const sameSite = getAuthCookieSameSite();

  return {
    httpOnly: true,
    secure: IS_PRODUCTION || sameSite === 'none',
    sameSite,
  };
}

function canExposeDevResetToken() {
  return ENABLE_DEV_RESET_TOKEN;
}

function isEmail(value) {
  return EMAIL_PATTERN.test(value);
}

function normalizeEmail(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

function signAuthToken(user) {
  return jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

function setAuthCookie(res, token) {
  res.cookie('token', token, {
    ...getAuthCookieOptions(),
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

function isDuplicateEmailError(error) {
  return error?.code === 11000 && Object.prototype.hasOwnProperty.call(error.keyPattern || {}, 'email');
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function emailCaseInsensitiveFilter(email) {
  return { email: new RegExp(`^${escapeRegExp(email)}$`, 'i') };
}

async function findUserByEmail(email, projection) {
  let query = User.findOne({ email });
  if (projection) query = query.select(projection);

  const exactUser = await query;
  if (exactUser) return exactUser;

  query = User.findOne(emailCaseInsensitiveFilter(email));
  if (projection) query = query.select(projection);
  return query;
}

function serializeUser(user) {
  if (!user) return null;

  const balance = Number(user.balance);
  const id = String(user._id || user.id);

  return {
    _id: id,
    id,
    name: user.name || '',
    email: user.email || '',
    role: user.role || 'user',
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
    message: error,
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
    message: error,
    warnings: [],
    error,
    ...extras,
  };
}

function authSessionResponse(user, _token, extras = {}) {
  // Token is no longer returned in the body — it lives in the httpOnly cookie set by setAuthCookie()
  return {
    success: true,
    user: serializeUser(user),
    ...extras,
  };
}

function authSessionError(message, extras = {}) {
  return {
    success: false,
    message,
    ...extras,
  };
}

function hashResetToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function buildResetUrl(token) {
  const url = new URL('/reset-password', getFrontendUrl());
  url.searchParams.set('token', token);
  return url.toString();
}

function validatePassword(password, fieldName = 'password') {
  if (typeof password !== 'string' || password.length < 8) {
    return `${fieldName} must be at least 8 characters.`;
  }
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    return `${fieldName} must include at least one letter and one number.`;
  }
  return null;
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
    const email = normalizeEmail(req.body?.email);
    const password = typeof req.body?.password === 'string' ? req.body.password : '';

    if (!name || !email || !password) {
      return res.status(400).json(authSessionError('name, email and password are required.'));
    }
    if (name.length < 2 || name.length > 80) {
      return res.status(400).json(authSessionError('name must be between 2 and 80 characters.'));
    }
    if (!isEmail(email)) {
      return res.status(400).json(authSessionError('A valid email is required.'));
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      return res.status(400).json(authSessionError(passwordError));
    }

    const existing = await findUserByEmail(email);
    if (existing) {
      return res.status(409).json(authSessionError('Email is already registered.'));
    }

    const user = await User.create({ name, email, password });
    const token = signAuthToken(user);
    setAuthCookie(res, token);

    return res.status(201).json(authSessionResponse(user, token));
  } catch (err) {
    if (isDuplicateEmailError(err)) {
      return res.status(409).json(authSessionError('Email is already registered.'));
    }

    return res.status(500).json(authSessionError('Unable to create account.'));
  }
});

router.post('/login', async (req, res) => {
  try {
    const email = normalizeEmail(req.body?.email);
    const password = typeof req.body?.password === 'string' ? req.body.password : '';

    if (!email || !password) {
      return res.status(400).json(authSessionError('email and password are required.'));
    }
    if (!isEmail(email)) {
      return res.status(400).json(authSessionError('A valid email is required.'));
    }

    const user = await findUserByEmail(email, '+password');
    if (!user) return res.status(401).json(authSessionError('Invalid credentials.'));

    const valid = await user.comparePassword(password);
    if (!valid) return res.status(401).json(authSessionError('Invalid credentials.'));

    const token = signAuthToken(user);
    setAuthCookie(res, token);
    return res.json(authSessionResponse(user, token));
  } catch (err) {
    return res.status(500).json(authSessionError('Unable to sign in.'));
  }
});

router.post('/logout', (req, res) => {
  res.clearCookie('token', {
    ...getAuthCookieOptions(),
  });
  return res.json({ success: true, message: 'Logged out successfully.' });
});

router.post('/forgot-password', async (req, res) => {
  try {
    const email = normalizeEmail(req.body?.email);
    if (!isEmail(email)) {
      return res.status(400).json(authActionError('A valid email is required.'));
    }

    const providerConfigured = isSmtpConfigured();
    const exposeDevResetToken = canExposeDevResetToken();
    const expiresMinutes = getResetPasswordExpiresMinutes();
    const user = await findUserByEmail(email);
    let devResetToken = null;
    let devResetUrl = null;

    if (user && !providerConfigured && !exposeDevResetToken) {
      user.resetPasswordTokenHash = null;
      user.resetPasswordExpires = null;
      user.updatedAt = new Date();
      await user.save();
    }

    if (user && (providerConfigured || exposeDevResetToken)) {
      const resetToken = crypto.randomBytes(RESET_TOKEN_BYTES).toString('hex');
      user.resetPasswordTokenHash = hashResetToken(resetToken);
      user.resetPasswordExpires = new Date(Date.now() + expiresMinutes * 60 * 1000);
      user.updatedAt = new Date();
      await user.save();

      const resetUrl = buildResetUrl(resetToken);

      if (providerConfigured) {
        try {
          await sendPasswordResetEmail({
            to: email,
            resetUrl,
            expiresMinutes,
          });
        } catch {
          if (!exposeDevResetToken) {
            user.resetPasswordTokenHash = null;
            user.resetPasswordExpires = null;
            user.updatedAt = new Date();
            await user.save();
          }
        }
      }

      if (exposeDevResetToken) {
        devResetToken = resetToken;
        devResetUrl = resetUrl;
      }
    } else if (exposeDevResetToken) {
      devResetToken = crypto.randomBytes(RESET_TOKEN_BYTES).toString('hex');
      devResetUrl = buildResetUrl(devResetToken);
    }

    return res.json(authActionResponse({
      message: PASSWORD_RESET_PUBLIC_MESSAGE,
      expiresMinutes,
      ...(exposeDevResetToken ? {
        devReset: {
          enabled: true,
          token: devResetToken,
          resetUrl: devResetUrl,
          note: 'Development only. Disable ENABLE_DEV_RESET_TOKEN_RESPONSE outside local testing.',
        },
        warnings: ['Development reset token response is enabled.'],
      } : {}),
    }));
  } catch (err) {
    return res.status(500).json(authActionError('Unable to create password reset request.'));
  }
});

router.post('/reset-password', async (req, res) => {
  try {
    const token = typeof req.body?.token === 'string' ? req.body.token.trim() : '';
    const newPassword = typeof req.body?.password === 'string'
      ? req.body.password
      : typeof req.body?.newPassword === 'string'
        ? req.body.newPassword
        : '';
    const passwordError = validatePassword(newPassword, 'password');

    if (!token) {
      return res.status(400).json(authActionError('Reset token is required.'));
    }
    if (passwordError) {
      return res.status(400).json(authActionError(passwordError));
    }

    const tokenHash = hashResetToken(token);
    const user = await User.findOne({
      resetPasswordTokenHash: tokenHash,
      resetPasswordExpires: { $gt: new Date() },
    }).select('+resetPasswordTokenHash +resetPasswordExpires');

    if (!user) {
      return res.status(400).json(authActionError('Reset token is invalid or expired.'));
    }

    user.password = newPassword;
    user.resetPasswordTokenHash = null;
    user.resetPasswordExpires = null;
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
      .select('name email role balance plan planExpiresAt createdAt updatedAt');

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
    try {
      const token = signAuthToken(req.user);
      setAuthCookie(res, token);
      // Cookie httpOnly posé — redirection directe vers /dashboard sans token dans l'URL
      res.redirect(`${getFrontendUrl()}/dashboard`);
    } catch (err) {
      res.redirect(`${getFrontendUrl()}/login?error=oauth_failed`);
    }
  },
);

module.exports = router;
