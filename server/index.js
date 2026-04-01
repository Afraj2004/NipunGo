// server/index.js

const express = require('express');
const dotenv  = require('dotenv');
const cors    = require('cors');
const helmet  = require('helmet');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const app = express();

// ════════════════════════════════════════════════
// 📌 CORS — Sabse PEHLE, helmet se bhi pehle
// ════════════════════════════════════════════════

const allowedOrigins = [
  'http://localhost:3000',
  'https://nipungo.vercel.app',
];

const corsOptions = {
  origin: function (origin, callback) {
    // No origin = mobile app / curl / Postman — allow karo
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    console.log('CORS blocked origin:', origin);
    return callback(new Error('CORS not allowed!'), false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
  ],
  optionsSuccessStatus: 200, // IE11 ke liye
};

// ── Preflight — SABSE PEHLE OPTIONS handle karo ──────────
app.options('*', cors(corsOptions));

// ── Sab routes pe CORS lagao ──────────────────────────────
app.use(cors(corsOptions));

// ════════════════════════════════════════════════
// 📌 SECURITY MIDDLEWARE
// ════════════════════════════════════════════════

// Helmet — CORS ke baad lagao
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    // ⚠️ contentSecurityPolicy band karo — Cloudinary images block ho sakti hain
    contentSecurityPolicy: false,
  })
);

// Global Rate Limit
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 200,                  // 100 → 200 kiya (photo upload ke liye)
  message: {
    success: false,
    message: 'Bahut zyada requests! Thodi der baad try karo.',
  },
  standardHeaders: true,
  legacyHeaders:   false,
  // ⚠️ OPTIONS requests ko rate limit se bahar rakho
  skip: (req) => req.method === 'OPTIONS',
});
app.use(globalLimiter);

// ════════════════════════════════════════════════
// 📌 BODY PARSERS
// ════════════════════════════════════════════════

// JSON — normal routes ke liye
app.use(express.json({ limit: '10kb' }));

// URL Encoded — form data ke liye
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// ⚠️ NOTE: Multipart/form-data (photo upload) ke liye
// multer khud handle karta hai — yahan kuch nahi chahiye

// ════════════════════════════════════════════════
// 📌 REQUEST LOGGER — Debug ke liye
// ════════════════════════════════════════════════
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path} — Origin: ${req.headers.origin}`);
    next();
  });
}

// ════════════════════════════════════════════════
// 📌 ROUTES
// ════════════════════════════════════════════════
app.use('/api/auth',    require('./routes/auth'));
app.use('/api/booking', require('./routes/booking'));
app.use('/api/worker',  require('./routes/worker'));
app.use('/api/admin',   require('./routes/admin'));
app.use('/api/review',  require('./routes/review'));
app.use('/api/payment', require('./routes/payment'));

// ════════════════════════════════════════════════
// 📌 HEALTH CHECK
// ════════════════════════════════════════════════
app.get('/', (req, res) => {
  res.json({
    message:  'NipunGo Server Chal Raha Hai! 🚀',
    version:  '2.0',
    status:   'OK',
    secured:  true,
    cors:     'Active ✅',
  });
});

// ════════════════════════════════════════════════
// 📌 404 HANDLER
// ════════════════════════════════════════════════
app.use('/{*splat}', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route nahi mila!',
  });
});

// ════════════════════════════════════════════════
// 📌 GLOBAL ERROR HANDLER
// ════════════════════════════════════════════════
app.use((err, req, res, next) => {
  // CORS error alag handle karo
  if (err.message === 'CORS not allowed!') {
    return res.status(403).json({
      success: false,
      message: 'CORS: Is origin se request allow nahi hai!',
    });
  }

  // Multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      message: 'File 5MB se badi nahi honi chahiye!',
    });
  }

  console.error('Global Error:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: 'Kuch galat hua!',
    error: process.env.NODE_ENV === 'development'
      ? err.message
      : 'Internal server error',
  });
});

// ════════════════════════════════════════════════
// 📌 SERVER START
// ════════════════════════════════════════════════
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server port ${PORT} par chal raha hai!`);
  console.log(`🔐 Security : Helmet + Rate Limiting Active`);
  console.log(`🌐 CORS     : ${allowedOrigins.join(', ')}`);
  console.log(`☁️  Cloudinary: ${
    process.env.CLOUDINARY_CLOUD_NAME ? '✅ Configured' : '❌ Missing!'
  }`);
});