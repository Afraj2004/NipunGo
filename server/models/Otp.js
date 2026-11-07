const mongoose = require('mongoose');

// One live code per (email, purpose). Used for sign-up and password reset.
const otpSchema = new mongoose.Schema({
  email: { type: String, required: true },
  purpose: { type: String, enum: ['register', 'reset'], required: true },
  codeHash: { type: String, required: true },

  // Sign-up only: what to create once the code is verified (password already hashed)
  payload: { type: Object, default: null },

  attempts: { type: Number, default: 0 },   // wrong guesses so far
  sends: { type: Number, default: 1 },      // how many times a code was emailed
  lastSentAt: { type: Date, default: Date.now },

  // MongoDB deletes the document automatically once this time passes
  expiresAt: { type: Date, required: true, index: { expireAfterSeconds: 0 } },
});

otpSchema.index({ email: 1, purpose: 1 }, { unique: true });

module.exports = mongoose.model('Otp', otpSchema);
