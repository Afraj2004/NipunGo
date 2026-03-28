const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');

// ════════════════════════════════════════════════
// 📌 RATE LIMITERS
// ════════════════════════════════════════════════

// Login limiter — 5 attempts per 15 min per IP
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 5,
  message: {
    success: false,
    message: 'Bahut zyada login attempts! 15 minute baad try karo.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Register limiter — 10 accounts per hour per IP
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,  // 1 hour
  max: 10,
  message: {
    success: false,
    message: 'Bahut zyada accounts banaye! 1 ghante baad try karo.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// ════════════════════════════════════════════════
// 📌 VALIDATION RULES
// ════════════════════════════════════════════════

const registerValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Naam likhna zaroori hai!')
    .isLength({ min: 2, max: 50 })
    .withMessage('Naam 2-50 characters ka hona chahiye!')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Naam mein sirf letters allowed hain!'),

  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email likhna zaroori hai!')
    .isEmail()
    .withMessage('Valid email likho!')
    .normalizeEmail(),

  body('phone')
    .trim()
    .notEmpty()
    .withMessage('Phone number zaroori hai!')
    .matches(/^[6-9]\d{9}$/)
    .withMessage('Valid 10 digit Indian phone number likho!'),

  body('password')
    .notEmpty()
    .withMessage('Password likhna zaroori hai!')
    .isLength({ min: 6 })
    .withMessage('Password kam se kam 6 characters ka hona chahiye!'),

  body('role')
    .optional()
    .isIn(['customer', 'worker'])
    .withMessage('Role sirf customer ya worker ho sakta hai!')
];

const loginValidation = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email likhna zaroori hai!')
    .isEmail()
    .withMessage('Valid email likho!')
    .normalizeEmail(),

  body('password')
    .notEmpty()
    .withMessage('Password likhna zaroori hai!')
];

// ════════════════════════════════════════════════
// 📌 VALIDATION ERROR HANDLER — Helper Function
// ════════════════════════════════════════════════
const handleValidationErrors = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Pehli error message user ko dikhao
    const firstError = errors.array()[0].msg;
    res.status(400).json({
      success: false,
      message: firstError,
      errors: errors.array().map(e => ({
        field: e.path,
        message: e.msg
      }))
    });
    return false;
  }
  return true;
};

// ════════════════════════════════════════════════
// 📌 1. REGISTER
// ════════════════════════════════════════════════
router.post(
  '/register',
  registerLimiter,      // Rate limit
  registerValidation,   // Validate
  async (req, res) => {
    // Validation check
    if (!handleValidationErrors(req, res)) return;

    try {
      const { name, email, phone, password, role } = req.body;

      // User pehle se exist karta hai?
      const userExists = await User.findOne({ email });
      if (userExists) {
        return res.status(400).json({
          success: false,
          message: 'Yeh email pehle se registered hai!'
        });
      }

      // Phone pehle se exist karta hai?
      const phoneExists = await User.findOne({ phone });
      if (phoneExists) {
        return res.status(400).json({
          success: false,
          message: 'Yeh phone number pehle se registered hai!'
        });
      }

      // Password hash karo
      const salt = await bcrypt.genSalt(12); // 12 rounds — more secure
      const hashedPassword = await bcrypt.hash(password, salt);

      // User banao
      const user = await User.create({
        name: name.trim(),
        email,
        phone,
        password: hashedPassword,
        // 👇 Admin role publicly nahi bana sakte
        role: role === 'worker' ? 'worker' : 'customer'
      });

      // Token banao
      const token = jwt.sign(
        { id: user._id },
        process.env.JWT_SECRET,
        { expiresIn: '30d' }
      );

      res.status(201).json({
        success: true,
        message: 'Registration successful! 🎉',
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role
        }
      });

    } catch (error) {
      // MongoDB duplicate key error
      if (error.code === 11000) {
        return res.status(400).json({
          success: false,
          message: 'Email ya phone pehle se registered hai!'
        });
      }
      res.status(500).json({
        success: false,
        message: 'Server Error!',
        error: error.message
      });
    }
  }
);

// ════════════════════════════════════════════════
// 📌 2. LOGIN
// ════════════════════════════════════════════════
router.post(
  '/login',
  loginLimiter,       // Rate limit — brute force rokta hai
  loginValidation,    // Validate
  async (req, res) => {
    // Validation check
    if (!handleValidationErrors(req, res)) return;

    try {
      const { email, password } = req.body;

      // User dhundo
      const user = await User.findOne({ email });
      if (!user) {
        // ⚠️ Same message dono cases mein — user enumeration rokta hai
        return res.status(400).json({
          success: false,
          message: 'Email ya password galat hai!'
        });
      }

      // Password check karo
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({
          success: false,
          message: 'Email ya password galat hai!'
        });
      }

      // Token banao
      const token = jwt.sign(
        { id: user._id },
        process.env.JWT_SECRET,
        { expiresIn: '30d' }
      );

      res.json({
        success: true,
        message: 'Login successful! 🎉',
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role
        }
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Server Error!',
        error: error.message
      });
    }
  }
);

// ════════════════════════════════════════════════
// 📌 3. GET CURRENT USER (Token se)
// ════════════════════════════════════════════════
const { protect } = require('../middleware/auth');

router.get('/me', protect, async (req, res) => {
  try {
    res.json({
      success: true,
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        phone: req.user.phone,
        role: req.user.role,
        isVerified: req.user.isVerified,
        service: req.user.service,
        city: req.user.city,
        rating: req.user.rating,
        createdAt: req.user.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error!'
    });
  }
});

module.exports = router;