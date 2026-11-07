const mongoose = require('mongoose');

const RETRY_DELAY_MS = 5000;

// Connects to MongoDB and keeps retrying instead of killing the process,
// so the server (and /health) stay up while Atlas wakes or recovers.
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4,
    });
    console.log('MongoDB Connected! ✅', `(db: ${mongoose.connection.name})`);
  } catch (error) {
    console.log(
      `MongoDB Error! ❌ ${error.message} — retrying in ${RETRY_DELAY_MS / 1000}s`
    );
    setTimeout(connectDB, RETRY_DELAY_MS);
  }
};

module.exports = connectDB;
