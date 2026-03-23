const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect(
      process.env.MONGO_URI,
      {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        family: 4
      }
    );
    console.log("MongoDB Connected! ✅");
  } catch (error) {
    console.log('MongoDB Error! ❌', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;