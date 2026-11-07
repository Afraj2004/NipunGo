const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const { ipKeyGenerator } = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { isStrongPassword, PASSWORD_MESSAGE } = require('../utils/otp');

const MAX_ADDRESSES = 5;
const isDev = process.env.NODE_ENV === 'development';

// Everything here is about the logged-in user's own account
router.use(protect);

const passwordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 6,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => `${ipKeyGenerator(req.ip)}|${req.user?.id}`,
  message: { success: false, message: 'Bahut zyada attempts! 15 minute baad try karo.' },
});

const fail = (res, error) =>
  res.status(500).json({
    success: false,
    message: 'Server Error!',
    ...(isDev ? { error: error.message } : {}),
  });

const validate = (req, res) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) return true;
  res.status(400).json({ success: false, message: errors.array()[0].msg });
  return false;
};

const publicProfile = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  role: user.role,
  createdAt: user.createdAt,
  addresses: user.addresses || [],
  // worker-only details (empty for customers)
  ...(user.role === 'worker'
    ? {
        service: user.service,
        city: user.city,
        price: user.price,
        experience: user.experience,
        about: user.about,
        photoUrl: user.photoUrl,
        rating: user.rating,
        totalReviews: user.totalReviews,
        isAvailable: user.isAvailable,
        isVerified: user.isVerified,
      }
    : {}),
});

// One line the booking flow can send as the booking address
const formatAddress = (a) =>
  [a.line, a.landmark ? `Near ${a.landmark}` : null, `${a.city} - ${a.pincode}`]
    .filter(Boolean)
    .join(', ');

const withFormatted = (a) => ({ ...a.toObject(), full: formatAddress(a) });

// ── Profile ────────────────────────────────────────────────
router.get('/profile', (req, res) => {
  res.json({ success: true, user: publicProfile(req.user) });
});

router.put(
  '/profile',
  [
    body('name')
      .isString().withMessage('Naam likhna zaroori hai!')
      .trim()
      .isLength({ min: 2, max: 50 }).withMessage('Naam 2-50 characters ka hona chahiye!')
      .matches(/^[a-zA-Z\s]+$/).withMessage('Naam mein sirf letters allowed hain!'),
  ],
  async (req, res) => {
    if (!validate(req, res)) return;
    try {
      req.user.name = req.body.name.trim();
      await req.user.save();
      res.json({ success: true, message: 'Profile update ho gaya!', user: publicProfile(req.user) });
    } catch (error) {
      fail(res, error);
    }
  }
);

// ── Change password (needs the current one) ────────────────
router.put(
  '/password',
  passwordLimiter,
  [
    body('currentPassword').isString().notEmpty().withMessage('Purana password likho!'),
    body('newPassword')
      .isString().withMessage(PASSWORD_MESSAGE)
      .custom((v) => isStrongPassword(v)).withMessage(PASSWORD_MESSAGE),
  ],
  async (req, res) => {
    if (!validate(req, res)) return;
    try {
      const { currentPassword, newPassword } = req.body;
      const user = await User.findById(req.user.id); // protect() strips the password field
      if (!user || !(await bcrypt.compare(currentPassword, user.password))) {
        return res.status(400).json({ success: false, message: 'Purana password galat hai!' });
      }
      if (await bcrypt.compare(newPassword, user.password)) {
        return res.status(400).json({ success: false, message: 'Naya password purane se alag hona chahiye!' });
      }

      user.password = await bcrypt.hash(newPassword, 12);
      // Every other device/session is logged out; this one gets a fresh token below
      user.passwordChangedAt = new Date();
      await user.save();

      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

      res.json({ success: true, message: 'Password change ho gaya!', token });
    } catch (error) {
      fail(res, error);
    }
  }
);

// ── Saved addresses (max 5) ────────────────────────────────
const addressRules = [
  body('label').optional().isIn(['Home', 'Work', 'Other']).withMessage('Label Home, Work ya Other ho sakta hai!'),
  body('line')
    .isString().withMessage('Address likhna zaroori hai!')
    .trim()
    .isLength({ min: 5, max: 150 }).withMessage('Address 5-150 characters ka hona chahiye!'),
  body('landmark').optional({ values: 'falsy' }).isString().trim().isLength({ max: 80 }).withMessage('Landmark bahut lamba hai!'),
  body('city')
    .isString().withMessage('City likhna zaroori hai!')
    .trim()
    .isLength({ min: 2, max: 50 }).withMessage('City 2-50 characters ki honi chahiye!'),
  body('pincode')
    .isString().withMessage('Pincode likhna zaroori hai!')
    .trim()
    .matches(/^\d{6}$/).withMessage('6 digit ka pincode likho!'),
  body('isDefault').optional().isBoolean().withMessage('Invalid value!'),
];

const pickAddress = (b) => ({
  label: b.label || 'Home',
  line: b.line.trim(),
  landmark: (b.landmark || '').trim(),
  city: b.city.trim(),
  pincode: b.pincode.trim(),
});

const setOnlyDefault = (user, id) => {
  user.addresses.forEach((a) => { a.isDefault = String(a._id) === String(id); });
};

router.get('/addresses', (req, res) => {
  res.json({ success: true, addresses: (req.user.addresses || []).map(withFormatted), max: MAX_ADDRESSES });
});

router.post('/addresses', addressRules, async (req, res) => {
  if (!validate(req, res)) return;
  try {
    if (req.user.addresses.length >= MAX_ADDRESSES) {
      return res.status(400).json({ success: false, message: `Aap sirf ${MAX_ADDRESSES} addresses save kar sakte ho!` });
    }
    const makeDefault = req.body.isDefault === true || req.body.isDefault === 'true' || req.user.addresses.length === 0;
    req.user.addresses.push({ ...pickAddress(req.body), isDefault: false });
    const added = req.user.addresses[req.user.addresses.length - 1];
    if (makeDefault) setOnlyDefault(req.user, added._id);
    await req.user.save();
    res.status(201).json({
      success: true,
      message: 'Address save ho gaya!',
      addresses: req.user.addresses.map(withFormatted),
    });
  } catch (error) {
    fail(res, error);
  }
});

router.put('/addresses/:id', addressRules, async (req, res) => {
  if (!validate(req, res)) return;
  try {
    const address = req.user.addresses.id(req.params.id);
    if (!address) return res.status(404).json({ success: false, message: 'Address nahi mila!' });
    Object.assign(address, pickAddress(req.body));
    if (req.body.isDefault === true || req.body.isDefault === 'true') setOnlyDefault(req.user, address._id);
    await req.user.save();
    res.json({ success: true, message: 'Address update ho gaya!', addresses: req.user.addresses.map(withFormatted) });
  } catch (error) {
    fail(res, error);
  }
});

router.put('/addresses/:id/default', async (req, res) => {
  try {
    const address = req.user.addresses.id(req.params.id);
    if (!address) return res.status(404).json({ success: false, message: 'Address nahi mila!' });
    setOnlyDefault(req.user, address._id);
    await req.user.save();
    res.json({ success: true, addresses: req.user.addresses.map(withFormatted) });
  } catch (error) {
    fail(res, error);
  }
});

router.delete('/addresses/:id', async (req, res) => {
  try {
    const address = req.user.addresses.id(req.params.id);
    if (!address) return res.status(404).json({ success: false, message: 'Address nahi mila!' });
    const wasDefault = address.isDefault;
    address.deleteOne();
    // Never leave the user without a default while addresses remain
    if (wasDefault && req.user.addresses.length) setOnlyDefault(req.user, req.user.addresses[0]._id);
    await req.user.save();
    res.json({ success: true, message: 'Address delete ho gaya!', addresses: req.user.addresses.map(withFormatted) });
  } catch (error) {
    fail(res, error);
  }
});

module.exports = router;
module.exports.formatAddress = formatAddress;
