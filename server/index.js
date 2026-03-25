const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const app = express();

// ── Middleware ──────────────────────────────────
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://nipungo.vercel.app'
  ],
  credentials: true
}));
app.use(express.json());

// ── Routes ──────────────────────────────────────
app.use('/api/auth', require('./routes/auth'));
app.use('/api/booking', require('./routes/booking'));
app.use('/api/worker', require('./routes/worker'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/review', require('./routes/review'));
app.use('/api/payment', require('./routes/payment'));

// ── Health Check ────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    message: 'NipunGo Server Chal Raha Hai! 🚀',
    version: '2.0',
    status: 'OK'
  });
});

// ── 404 Handler ─────────────────────────────────
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route nahi mila!'
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server port ${PORT} par chal raha hai!`);
  console.log(`🌐 URL: http://localhost:${PORT}`);
});