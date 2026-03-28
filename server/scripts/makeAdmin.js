// server/scripts/makeAdmin.js
// node scripts/makeAdmin.js

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const makeAdmin = async () => {
  await mongoose.connect(process.env.MONGO_URI);

  const user = await User.findOneAndUpdate(
    { email: 'your-email@gmail.com' }, // 👈 Apna email daalo
    { role: 'admin' },
    { new: true }
  );

  console.log('Admin ban gaya:', user?.name);
  process.exit(0);
};

makeAdmin();