const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const app = express();

// ════════════════════════════════════════════════
// 📌 SECURITY MIDDLEWARE — Sabse Pehle
// ════════════════════════════════════════════════

// 1. Helmet — Security headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// 2. Global Rate Limit — sab routes pe
//    100 requests per 15 min per IP
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    message: 'Bahut zyada requests! Thodi der baad try karo.'
  },
  standardHeaders: true,
  legacyHeaders: false
});
app.use(globalLimiter);

// 3. CORS — sirf allowed origins
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://nipungo.vercel.app'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// 4. JSON Body Parser — size limit
app.use(express.json({ limit: '10kb' })); // 10kb se bada payload reject

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
    message: 'NipunGo Server Chal Raha Hai! 🚀',
    version: '2.0',
    status: 'OK',
    secured: true
  });
});

// ════════════════════════════════════════════════
// 📌 404 HANDLER
// ════════════════════════════════════════════════
app.use('/{*splat}', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route nahi mila!'
  });
});

// ════════════════════════════════════════════════
// 📌 GLOBAL ERROR HANDLER
// ════════════════════════════════════════════════
app.use((err, req, res, next) => {
  console.error('Global Error:', err.stack);
  res.status(500).json({
    success: false,
    message: 'Kuch galat hua!',
    error: process.env.NODE_ENV === 'development'
      ? err.message
      : 'Internal server error'
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server port ${PORT} par chal raha hai!`);
  console.log(`🔐 Security: Helmet + Rate Limiting Active`);
});