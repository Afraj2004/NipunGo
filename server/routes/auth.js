const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Otp = require('../models/Otp');
const rateLimit = require('express-rate-limit');
const { ipKeyGenerator } = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const validator = require('validator');
const { sendWelcomeEmail, sendOtpEmail } = require('../utils/emailService');
const {
  generateOtp,
  hashOtp,
  verifyOtp,
  isStrongPassword,
  PASSWORD_MESSAGE,
} = require('../utils/otp');
const { protect } = require('../middleware/auth');

// ── OTP settings ──────────────────────────────────────────
const OTP_MINUTES = 10;          // how long a code stays valid
const OTP_MAX_ATTEMPTS = 5;      // wrong guesses before the code is burned
const OTP_RESEND_SECONDS = 30;   // minimum gap between emails
const OTP_MAX_SENDS = 5;         // emails per code before the user must start over
const TOKEN_LIFETIME = '7d';

const isDev = process.env.NODE_ENV === 'development';

// ── Rate limiters ─────────────────────────────────────────
// Keyed by IP (+ the account being attacked where there is one), and failed-only
// for login, so a real user is never locked out by other people's traffic.
const limiter = ({ windowMs, max, message, keyFn, skipSuccessfulRequests = false }) =>
  rateLimit({
    windowMs,
    limit: max,
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests,
    keyGenerator: (req) => `${ipKeyGenerator(req.ip)}|${keyFn ? keyFn(req) : ''}`,
    message: { success: false, message },
  });

const loginLimiter = limiter({
  windowMs: 15 * 60 * 1000,
  max: 8,
  skipSuccessfulRequests: true,
  keyFn: (req) => String(req.body?.emailOrPhone || '').toLowerCase().slice(0, 100),
  message: 'Bahut zyada galat login attempts! 15 minute baad try karo.',
});

const otpStartLimiter = limiter({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: 'Bahut zyada requests! 1 ghante baad try karo.',
});

const otpVerifyLimiter = limiter({
  windowMs: 15 * 60 * 1000,
  max: 20,
  keyFn: (req) => String(req.body?.email || '').toLowerCase().slice(0, 100),
  message: 'Bahut zyada attempts! 15 minute baad try karo.',
});

// ── Validation ────────────────────────────────────────────
const emailRule = body('email')
  .isString().withMessage('Valid email likho!')
  .trim()
  .notEmpty().withMessage('Email likhna zaroori hai!')
  .isEmail().withMessage('Valid email likho!')
  .isLength({ max: 120 }).withMessage('Email bahut lamba hai!')
  .normalizeEmail();

const passwordRule = (field = 'password') =>
  body(field)
    .isString().withMessage('Password likhna zaroori hai!')
    .custom((v) => isStrongPassword(v)).withMessage(PASSWORD_MESSAGE);

const otpRule = body('otp')
  .isString().withMessage('OTP likho!')
  .trim()
  .matches(/^\d{6}$/).withMessage('OTP 6 digit ka hota hai!');

const registerValidation = [
  body('name')
    .isString().withMessage('Naam likhna zaroori hai!')
    .trim()
    .notEmpty().withMessage('Naam likhna zaroori hai!')
    .isLength({ min: 2, max: 50 }).withMessage('Naam 2-50 characters ka hona chahiye!')
    .matches(/^[a-zA-Z\s]+$/).withMessage('Naam mein sirf letters allowed hain!'),
  emailRule,
  body('phone')
    .isString().withMessage('Phone number zaroori hai!')
    .trim()
    .matches(/^[6-9]\d{9}$/).withMessage('Valid 10 digit Indian phone number likho!'),
  passwordRule('password'),
  body('role')
    .optional()
    .isIn(['customer', 'worker']).withMessage('Role sirf customer ya worker ho sakta hai!'),
];

const loginValidation = [
  body('emailOrPhone')
    .isString().withMessage('Email ya Phone number likhna zaroori hai!')
    .trim()
    .notEmpty().withMessage('Email ya Phone number likhna zaroori hai!')
    .isLength({ max: 120 }),
  body('password')
    .isString().withMessage('Password likhna zaroori hai!')
    .notEmpty().withMessage('Password likhna zaroori hai!')
    .isLength({ max: 200 }),
];

const handleValidationErrors = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      message: errors.array()[0].msg,
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
    return false;
  }
  return true;
};

// ── Helpers ───────────────────────────────────────────────
const serverError = (res, error, message = 'Server Error!') =>
  res.status(500).json({
    success: false,
    message,
    ...(isDev ? { error: error.message } : {}),
  });

const signToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: TOKEN_LIFETIME });

const publicUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  role: user.role,
});

// Hash compared against when the account doesn't exist, so "no such user" takes as
// long as "wrong password" and timing can't be used to find registered emails.
const DUMMY_HASH = bcrypt.hashSync('timing-equaliser', 12);

const secondsSince = (date) => (Date.now() - new Date(date).getTime()) / 1000;

// Create/replace the code for (email, purpose) and email it.
// Throws if the email could not be sent (the stored code is removed again).
const issueOtp = async ({ email, purpose, name, payload = null, existing = null }) => {
  const otp = generateOtp(6);
  const doc = await Otp.findOneAndUpdate(
    { email, purpose },
    {
      email,
      purpose,
      codeHash: hashOtp(`${email}:${purpose}`, otp),
      ...(payload ? { payload } : {}),
      attempts: 0,
      sends: existing ? existing.sends + 1 : 1,
      lastSentAt: new Date(),
      expiresAt: new Date(Date.now() + OTP_MINUTES * 60 * 1000),
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  try {
    await sendOtpEmail({ name, email, otp, purpose, minutes: OTP_MINUTES });
  } catch (err) {
    console.error('OTP email failed:', err.message);
    if (!existing) await Otp.deleteOne({ _id: doc._id });
    throw err;
  }
};

// Check a submitted code. Returns { ok, doc } or { ok:false, status, message }.
const checkOtp = async ({ email, purpose, otp }) => {
  const doc = await Otp.findOne({ email, purpose });
  if (!doc || doc.expiresAt < new Date()) {
    return { ok: false, status: 400, message: 'OTP expire ho gaya ya mila nahi. Dobara OTP mangao.' };
  }
  if (doc.attempts >= OTP_MAX_ATTEMPTS) {
    await Otp.deleteOne({ _id: doc._id });
    return { ok: false, status: 429, message: 'Bahut zyada galat attempts. Naya OTP mangao.' };
  }
  if (!verifyOtp(`${email}:${purpose}`, otp, doc.codeHash)) {
    doc.attempts += 1;
    await doc.save();
    const left = OTP_MAX_ATTEMPTS - doc.attempts;
    return {
      ok: false,
      status: 400,
      message: left > 0 ? `OTP galat hai! ${left} attempt bache hain.` : 'OTP galat hai! Naya OTP mangao.',
    };
  }
  return { ok: true, doc };
};

const resendBlocked = (doc) => {
  if (!doc) return null;
  const wait = Math.ceil(OTP_RESEND_SECONDS - secondsSince(doc.lastSentAt));
  if (wait > 0) return { status: 429, message: `${wait} second baad dobara OTP mangao.`, wait };
  if (doc.sends >= OTP_MAX_SENDS) {
    return { status: 429, message: 'OTP bahut baar bhej diya gaya. Pehle se shuru karo.', wait: 0 };
  }
  return null;
};

// ════════════════════════════════════════════════
// 📌 1. REGISTER — step 1: validate, email an OTP
//    (no account exists until the OTP is verified)
// ════════════════════════════════════════════════
router.post('/register/start', otpStartLimiter, registerValidation, async (req, res) => {
  if (!handleValidationErrors(req, res)) return;

  try {
    const { name, email, phone, password } = req.body;
    const role = req.body.role === 'worker' ? 'worker' : 'customer';

    if (await User.findOne({ email })) {
      return res.status(400).json({ success: false, message: 'Yeh email pehle se registered hai!' });
    }
    if (await User.findOne({ phone })) {
      return res.status(400).json({ success: false, message: 'Yeh phone number pehle se registered hai!' });
    }

    const existing = await Otp.findOne({ email, purpose: 'register' });
    const blocked = resendBlocked(existing);
    if (blocked) {
      return res.status(429).json({ success: false, message: blocked.message, retryAfter: blocked.wait });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    await issueOtp({
      email,
      purpose: 'register',
      name: name.trim(),
      payload: { name: name.trim(), phone, passwordHash, role },
      existing,
    });

    res.json({
      success: true,
      message: 'OTP aapki email pe bhej diya gaya hai!',
      email,
      expiresInMinutes: OTP_MINUTES,
      resendAfterSeconds: OTP_RESEND_SECONDS,
    });
  } catch (error) {
    console.error('register/start error:', error.message);
    res.status(502).json({
      success: false,
      message: 'OTP email nahi bhej paye. Thodi der baad try karo.',
    });
  }
});

// ── 1b. Resend the sign-up OTP ───────────────────────────
router.post('/register/resend', otpStartLimiter, [emailRule], async (req, res) => {
  if (!handleValidationErrors(req, res)) return;

  try {
    const { email } = req.body;
    const existing = await Otp.findOne({ email, purpose: 'register' });
    if (!existing || !existing.payload) {
      return res.status(400).json({ success: false, message: 'Pehle registration shuru karo.' });
    }
    const blocked = resendBlocked(existing);
    if (blocked) {
      return res.status(429).json({ success: false, message: blocked.message, retryAfter: blocked.wait });
    }
    await issueOtp({
      email,
      purpose: 'register',
      name: existing.payload.name,
      existing,
    });
    res.json({
      success: true,
      message: 'Naya OTP bhej diya gaya hai!',
      resendAfterSeconds: OTP_RESEND_SECONDS,
    });
  } catch (error) {
    console.error('register/resend error:', error.message);
    res.status(502).json({ success: false, message: 'OTP email nahi bhej paye. Thodi der baad try karo.' });
  }
});

// ── 1c. Register — step 2: verify the OTP, create the account ─
router.post('/register/verify', otpVerifyLimiter, [emailRule, otpRule], async (req, res) => {
  if (!handleValidationErrors(req, res)) return;

  try {
    const { email, otp } = req.body;
    const result = await checkOtp({ email, purpose: 'register', otp });
    if (!result.ok) {
      return res.status(result.status).json({ success: false, message: result.message });
    }

    const { name, phone, passwordHash, role } = result.doc.payload || {};
    if (!name || !phone || !passwordHash) {
      await Otp.deleteOne({ _id: result.doc._id });
      return res.status(400).json({ success: false, message: 'Registration data nahi mila. Dobara shuru karo.' });
    }

    // Someone may have registered these details while the OTP was pending
    if ((await User.findOne({ email })) || (await User.findOne({ phone }))) {
      await Otp.deleteOne({ _id: result.doc._id });
      return res.status(400).json({ success: false, message: 'Email ya phone pehle se registered hai!' });
    }

    // role is forced to customer/worker here; admin can never be created over the API
    const user = await User.create({
      name,
      email,
      phone,
      password: passwordHash,
      role: role === 'worker' ? 'worker' : 'customer',
    });
    await Otp.deleteOne({ _id: result.doc._id });

    sendWelcomeEmail({ name: user.name, email: user.email, role: user.role }).catch((err) =>
      console.log('Welcome email error:', err.message)
    );

    res.status(201).json({
      success: true,
      message: 'Registration successful! 🎉',
      token: signToken(user._id),
      user: publicUser(user),
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Email ya phone pehle se registered hai!' });
    }
    console.error('register/verify error:', error.message);
    serverError(res, error);
  }
});

// ════════════════════════════════════════════════
// 📌 2. LOGIN
// ════════════════════════════════════════════════
router.post('/login', loginLimiter, loginValidation, async (req, res) => {
  if (!handleValidationErrors(req, res)) return;

  try {
    const { emailOrPhone, password } = req.body;
    const id = emailOrPhone.trim();

    const user = id.includes('@')
      ? await User.findOne({ email: validator.normalizeEmail(id) || id.toLowerCase() })
      : await User.findOne({ phone: id });

    // Same work and same message whether or not the account exists
    const isMatch = await bcrypt.compare(password, user ? user.password : DUMMY_HASH);
    if (!user || !isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Email/Phone ya password galat hai!',
      });
    }

    res.json({
      success: true,
      message: 'Login successful! 🎉',
      token: signToken(user._id),
      user: publicUser(user),
    });
  } catch (error) {
    console.error('login error:', error.message);
    serverError(res, error);
  }
});

// ════════════════════════════════════════════════
// 📌 3. FORGOT PASSWORD — email an OTP
//    Always answers the same way, so it can't be used to find registered emails.
// ════════════════════════════════════════════════
router.post('/forgot-password', otpStartLimiter, [emailRule], async (req, res) => {
  if (!handleValidationErrors(req, res)) return;

  const generic = {
    success: true,
    message: 'Agar yeh email registered hai toh OTP bhej diya gaya hai!',
    expiresInMinutes: OTP_MINUTES,
    resendAfterSeconds: OTP_RESEND_SECONDS,
  };

  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.json(generic);

    const existing = await Otp.findOne({ email, purpose: 'reset' });
    if (resendBlocked(existing)) return res.json(generic); // quietly ignore rapid repeats

    await issueOtp({ email, purpose: 'reset', name: user.name, existing });
    res.json(generic);
  } catch (error) {
    console.error('forgot-password error:', error.message);
    // Don't reveal whether the account exists even when email delivery fails
    res.json(generic);
  }
});

// ════════════════════════════════════════════════
// 📌 4. RESET PASSWORD — verify OTP, set a new password
// ════════════════════════════════════════════════
router.post(
  '/reset-password',
  otpVerifyLimiter,
  [emailRule, otpRule, passwordRule('password')],
  async (req, res) => {
    if (!handleValidationErrors(req, res)) return;

    try {
      const { email, otp, password } = req.body;
      const result = await checkOtp({ email, purpose: 'reset', otp });
      if (!result.ok) {
        return res.status(result.status).json({ success: false, message: result.message });
      }

      const user = await User.findOne({ email });
      if (!user) {
        await Otp.deleteOne({ _id: result.doc._id });
        return res.status(400).json({ success: false, message: 'OTP expire ho gaya ya mila nahi.' });
      }

      user.password = await bcrypt.hash(password, 12);
      user.passwordChangedAt = new Date(); // logs out every older session
      user.passwordResetToken = null;
      user.passwordResetExpiry = null;
      await user.save();
      await Otp.deleteOne({ _id: result.doc._id });

      res.json({ success: true, message: 'Password change ho gaya! Ab login karo. 🎉' });
    } catch (error) {
      console.error('reset-password error:', error.message);
      serverError(res, error);
    }
  }
);

// ════════════════════════════════════════════════
// 📌 5. GET CURRENT USER
// ════════════════════════════════════════════════
router.get('/me', protect, async (req, res) => {
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
      createdAt: req.user.createdAt,
    },
  });
});

module.exports = router;
