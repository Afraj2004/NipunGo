const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ['customer', 'worker', 'admin'],
    default: 'customer'
  },

  // ── Worker Fields ──────────────────────────────────────
  service: { type: String, default: '' },
  city: { type: String, default: '' },
  rating: { type: Number, default: 0 },
  totalReviews: { type: Number, default: 0 },
  price: { type: Number, default: 0 },
  experience: { type: String, default: '' },
  about: { type: String, default: '' },
  isVerified: { type: Boolean, default: false },
  isAvailable: { type: Boolean, default: true },

  // 👇 NEW — Photo Fields
  photoUrl: {
    type: String,
    default: ''          // Cloudinary URL
  },
  photoPublicId: {
    type: String,
    default: ''          // Cloudinary public_id (delete ke liye)
  },

  // ── Password Reset ─────────────────────────────────────
  passwordResetToken: { type: String, default: null },
  passwordResetExpiry: { type: Date, default: null },

  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);