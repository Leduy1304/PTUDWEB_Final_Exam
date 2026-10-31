const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const auth = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

function signToken(user) {
  return jwt.sign({ id: user._id, role: user.role || 'user' }, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '7d' });
}

function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
  }
  next();
}

function publicUser(u) {
  return { id: u._id, name: u.name, email: u.email, organization: u.organization, role: u.role || 'user' };
}

/** POST /api/auth/register — create account, returns { token, user } */
router.post(
  '/register',
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('A valid email is required').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('organization').optional().trim(),
  validate,
  asyncHandler(async (req, res) => {
    const { name, email, password, organization } = req.body;
    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ message: 'Email is already registered' });
    const passwordHash = await User.hashPassword(password);
    // Any `role` sent by the client is IGNORED — new accounts are always
    // regular users. The single exception: when ADMIN_EMAIL is configured and
    // the registering email matches it (case-insensitive), grant "admin" so a
    // fresh deployment can bootstrap its first administrator.
    const adminEmail = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
    const role = adminEmail && email.toLowerCase() === adminEmail ? 'admin' : 'user';
    const user = await User.create({ name, email, passwordHash, organization, role });
    res.status(201).json({ token: signToken(user), user: publicUser(user) });
  })
);

/** POST /api/auth/login — sign in, returns { token, user } */
router.post(
  '/login',
  body('email').isEmail().withMessage('A valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
  validate,
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    res.json({ token: signToken(user), user: publicUser(user) });
  })
);

/** GET /api/auth/me — current user profile */
router.get('/me', auth, asyncHandler(async (req, res) => {
  res.json(publicUser(req.user));
}));

/** PATCH /api/auth/me — update profile (name, organization) */
router.patch(
  '/me',
  auth,
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  body('organization').optional().trim(),
  validate,
  asyncHandler(async (req, res) => {
    if (req.body.name !== undefined) req.user.name = req.body.name;
    if (req.body.organization !== undefined) req.user.organization = req.body.organization;
    await req.user.save();
    res.json(publicUser(req.user));
  })
);

module.exports = router;
