// server/index.js

const express   = require('express');
const dotenv    = require('dotenv');
const cors      = require('cors');
const helmet    = require('helmet');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const app = express();

// ════════════════════════════════════════════════
// 📌 CORS CONFIG
// ════════════════════════════════════════════════

const allowedOrigins = [
  'http://localhost:3000',
  'https://nipungo.vercel.app',
];

const corsOptions = {
  origin: function (origin, callback) {
    // No origin = Postman / curl / mobile — allow
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    console.log('CORS blocked origin:', origin);
    return callback(new Error('CORS not allowed!'), false);
  },
  credentials:         true,
  methods:             ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders:      [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
  ],
  optionsSuccessStatus: 200,
};

// ── ✅ FIX: '/*' ki jagah middleware function use karo ────
// app.options('*', ...) Express 5 mein kaam nahi karta
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    return cors(corsOptions)(req, res, next);
  }
  next();
});

// ── Sab routes pe CORS ────────────────────────────────────
app.use(cors(corsOptions));

// ════════════════════════════════════════════════
// 📌 SECURITY MIDDLEWARE
// ════════════════════════════════════════════════

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    // Cloudinary images block na hon
    contentSecurityPolicy:     false,
  })
);

// Global Rate Limit
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      200,
  message: {
    success: false,
    message: 'Bahut zyada requests! Thodi der baad try karo.',
  },
  standardHeaders: true,
  legacyHeaders:   false,
  // OPTIONS ko rate limit se bahar rakho
  skip: (req) => req.method === 'OPTIONS',
});
app.use(globalLimiter);

// ════════════════════════════════════════════════
// 📌 BODY PARSERS
// ════════════════════════════════════════════════

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// ════════════════════════════════════════════════
// 📌 REQUEST LOGGER
// ════════════════════════════════════════════════

app.use((req, res, next) => {
  console.log(
    `[${new Date().toISOString()}] ${req.method} ${req.path}` +
    ` — Origin: ${req.headers.origin || 'none'}`
  );
  next();
});

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

// ✅ FIX: '/{*splat}' ki jagah simple middleware
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route nahi mila: ${req.method} ${req.path}`,
  });
});

// ════════════════════════════════════════════════
// 📌 GLOBAL ERROR HANDLER
// ════════════════════════════════════════════════

app.use((err, req, res, next) => {
  // CORS error
  if (err.message === 'CORS not allowed!') {
    return res.status(403).json({
      success: false,
      message: 'CORS: Is origin se request allow nahi hai!',
    });
  }

  // Multer — file size
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      message: 'File 5MB se badi nahi honi chahiye!',
    });
  }

  // Multer — file type
  if (err.message?.includes('allowed')) {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }

  console.error('Global Error:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: 'Kuch galat hua!',
    error:   process.env.NODE_ENV === 'development'
      ? err.message
      : 'Internal server error',
  });
});

// ════════════════════════════════════════════════
// 📌 SERVER START
// ════════════════════════════════════════════════

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅  Server       : port ${PORT}`);
  console.log(`🔐  Security     : Helmet + Rate Limiting`);
  console.log(`🌐  CORS         : ${allowedOrigins.join(', ')}`);
  console.log(`☁️   Cloudinary   : ${
    process.env.CLOUDINARY_CLOUD_NAME ? '✅ Configured' : '❌ .env missing!'
  }`);
  console.log(`🗄️   MongoDB      : Connecting...`);
});