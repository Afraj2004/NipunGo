// Turns an existing account into an admin.
//
//   1. Register normally on the website (the OTP email proves the address is yours)
//   2. node scripts/makeAdmin.js you@gmail.com
//   3. Log out and log in again; you will land on /admin
//
// Admins can never be created through the public API, only with this script.

require('dotenv').config();
const mongoose = require('mongoose');
const validator = require('validator');
const User = require('../models/User');

const run = async () => {
  const raw = process.argv[2];
  if (!raw) {
    console.log('Usage: node scripts/makeAdmin.js you@gmail.com');
    process.exit(1);
  }

  // Emails are stored the same way sign-up normalises them (e.g. Gmail dots removed)
  const email = validator.normalizeEmail(raw) || raw.toLowerCase();

  await mongoose.connect(process.env.MONGO_URI);
  const user = await User.findOne({ email });

  if (!user) {
    console.log(`No account found for ${email}. Register on the website first, then run this again.`);
    process.exit(1);
  }
  if (user.role === 'admin') {
    console.log(`${user.name} (${email}) is already an admin.`);
    process.exit(0);
  }

  user.role = 'admin';
  await user.save();
  console.log(`Done: ${user.name} (${email}) is now an admin. Log out and back in.`);
  process.exit(0);
};

run().catch((err) => {
  console.error('Failed:', err.message);
  process.exit(1);
});
