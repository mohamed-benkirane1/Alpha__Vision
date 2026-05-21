const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const auth = require('../middleware/auth');
const passport = require('../config/passport');

const PROFILE_FIELDS = ['name'];

function nowIso() {
  return new Date().toISOString();
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
  passport.authenticate('google', { scope: ['profile', 'email'], session: false }),
);

router.get('/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: 'http://localhost:5171/login' }),
  (req, res) => {
    const token = jwt.sign({ id: req.user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.redirect(`http://localhost:5171/auth/callback?token=${token}`);
  },
);

module.exports = router;
