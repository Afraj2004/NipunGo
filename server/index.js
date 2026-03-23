const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

// Config
dotenv.config();
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/booking', require('./routes/booking'));

// Test Route
app.get('/', (req, res) => {
  res.json({ 
    message: 'NipunGo Server Chal Raha Hai! 🚀' 
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server port ${PORT} par chal raha hai! ✅`);
});