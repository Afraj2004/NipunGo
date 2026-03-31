const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');  // 👈 NEW
const User = require('../models/User');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const {
  sendWelcomeEmail,
  sendPasswordResetEmail
} = require('../utils/emailService');  // 👈 NEW
const { protect } = require('../middleware/auth');

// ── Rate Limiters ─────────────────────────────────────────
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    message: 'Bahut zyada login attempts! 15 minute baad try karo.'
  }
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    message: 'Bahut zyada accounts! 1 ghante baad try karo.'
  }
});

const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: {
    success: false,
    message: 'Bahut zyada requests! 1 ghante baad try karo.'
  }
});

// ── Validation Rules ──────────────────────────────────────
const registerValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Naam likhna zaroori hai!')
    .isLength({ min: 2, max: 50 })
    .withMessage('Naam 2-50 characters ka hona chahiye!')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Naam mein sirf letters allowed hain!'),
  body('email')
    .trim()
    .notEmpty().withMessage('Email likhna zaroori hai!')
    .isEmail().withMessage('Valid email likho!')
    .normalizeEmail(),
  body('phone')
    .trim()
    .notEmpty().withMessage('Phone number zaroori hai!')
    .matches(/^[6-9]\d{9}$/)
    .withMessage('Valid 10 digit Indian phone number likho!'),
  body('password')
    .notEmpty().withMessage('Password likhna zaroori hai!')
    .isLength({ min: 6 })
    .withMessage('Password kam se kam 6 characters ka hona chahiye!'),
  body('role')
    .optional()
    .isIn(['customer', 'worker'])
    .withMessage('Role sirf customer ya worker ho sakta hai!')
];

const loginValidation = [
  body('emailOrPhone')
    .trim()
    .notEmpty()
    .withMessage('Email ya Phone number likhna zaroori hai!'),
  body('password')
    .notEmpty()
    .withMessage('Password likhna zaroori hai!')
];

// ── Validation Error Handler ──────────────────────────────
const handleValidationErrors = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      message: errors.array()[0].msg,
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
  registerLimiter,
  registerValidation,
  async (req, res) => {
    if (!handleValidationErrors(req, res)) return;

    try {
      const { name, email, phone, password, role } = req.body;

      const userExists = await User.findOne({ email });
      if (userExists) {
        return res.status(400).json({
          success: false,
          message: 'Yeh email pehle se registered hai!'
        });
      }

      const phoneExists = await User.findOne({ phone });
      if (phoneExists) {
        return res.status(400).json({
          success: false,
          message: 'Yeh phone number pehle se registered hai!'
        });
      }

      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash(password, salt);

      const user = await User.create({
        name: name.trim(),
        email,
        phone,
        password: hashedPassword,
        role: role === 'worker' ? 'worker' : 'customer'
      });

      const token = jwt.sign(
        { id: user._id },
        process.env.JWT_SECRET,
        { expiresIn: '30d' }
      );

      // 👇 Welcome Email bhejo (async — response wait nahi karega)
      sendWelcomeEmail({
        name: user.name,
        email: user.email,
        role: user.role
      }).catch(err =>
        console.log('Welcome email error:', err.message)
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
  loginLimiter,
  loginValidation,
  async (req, res) => {
    if (!handleValidationErrors(req, res)) return;

    try {
      const { emailOrPhone, password } = req.body;

      // 👇 Check karo — email hai ya phone?
      const isEmail = emailOrPhone.includes('@');

      let user;

      if (isEmail) {
        // Email se dhundo
        const normalizedEmail = emailOrPhone
          .toLowerCase()
          .trim();
        user = await User.findOne({ email: normalizedEmail });
      } else {
        // Phone se dhundo
        const cleanPhone = emailOrPhone.trim();
        user = await User.findOne({ phone: cleanPhone });
      }

      // User nahi mila
      if (!user) {
        return res.status(400).json({
          success: false,
          message: 'Email/Phone ya password galat hai!'
        });
      }

      // Password check
      const isMatch = await bcrypt.compare(
        password,
        user.password
      );
      if (!isMatch) {
        return res.status(400).json({
          success: false,
          message: 'Email/Phone ya password galat hai!'
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
// 📌 3. FORGOT PASSWORD
// ════════════════════════════════════════════════
router.post(
  '/forgot-password',
  forgotPasswordLimiter,
  [
    body('email')
      .trim()
      .notEmpty().withMessage('Email likhna zaroori hai!')
      .isEmail().withMessage('Valid email likho!')
      .normalizeEmail()
  ],
  async (req, res) => {
    if (!handleValidationErrors(req, res)) return;

    try {
      const { email } = req.body;

      const user = await User.findOne({ email });

      // ⚠️ Security: User exist kare ya na kare
      // same response dete hain — enumeration rokta hai
      if (!user) {
        return res.json({
          success: true,
          message: 'Agar email registered hai toh reset link aayega!'
        });
      }

      // Reset token banao
      const resetToken = crypto
        .randomBytes(32)
        .toString('hex');

      // Hash karke save karo
      const hashedToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

      user.passwordResetToken = hashedToken;
      user.passwordResetExpiry = new Date(
        Date.now() + 15 * 60 * 1000  // 15 minutes
      );
      await user.save();

      // Reset email bhejo
      await sendPasswordResetEmail({
        name: user.name,
        email: user.email,
        resetToken  // unhashed token email mein
      });

      res.json({
        success: true,
        message: 'Password reset link aapki email pe bheja gaya!'
      });

    } catch (error) {
      console.log('Forgot password error:', error);
      res.status(500).json({
        success: false,
        message: 'Email send nahi ho saka!'
      });
    }
  }
);

// ════════════════════════════════════════════════
// 📌 4. RESET PASSWORD
// ════════════════════════════════════════════════
router.post(
  '/reset-password/:token',
  [
    body('password')
      .notEmpty().withMessage('Naya password likhna zaroori hai!')
      .isLength({ min: 6 })
      .withMessage('Password kam se kam 6 characters ka hona chahiye!')
  ],
  async (req, res) => {
    if (!handleValidationErrors(req, res)) return;

    try {
      const { token } = req.params;
      const { password } = req.body;

      // Token hash karo — DB se match karo
      const hashedToken = crypto
        .createHash('sha256')
        .update(token)
        .digest('hex');

      const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpiry: { $gt: Date.now() }  // Expire nahi hua
      });

      if (!user) {
        return res.status(400).json({
          success: false,
          message: 'Reset link invalid ya expire ho gaya! Dobara try karo.'
        });
      }

      // Naya password set karo
      const salt = await bcrypt.genSalt(12);
      user.password = await bcrypt.hash(password, salt);
      user.passwordResetToken = null;
      user.passwordResetExpiry = null;
      await user.save();

      res.json({
        success: true,
        message: 'Password change ho gaya! Ab login karo. 🎉'
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
// 📌 5. GET CURRENT USER
// ════════════════════════════════════════════════
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