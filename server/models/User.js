const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  phone: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    // 👇 Admin role add kiya
    enum: ['customer', 'worker', 'admin'],
    default: 'customer'
  },

  // ── Worker Fields ──────────────────────────
  service: {
    type: String,
    default: ''
  },
  city: {
    type: String,
    default: ''
  },
  rating: {
    type: Number,
    default: 0
  },
  totalReviews: {
    type: Number,
    default: 0
  },
  price: {
    type: Number,
    default: 0
  },
  experience: {
    type: String,
    default: ''
  },
  about: {
    type: String,
    default: ''
  },
  isVerified: {
    type: Boolean,
    default: false
  },

  // 👇 YE NEW FIELD ADD KIYA — Worker free hai ya busy
  isAvailable: {
    type: Boolean,
    default: true   // default free rehta hai
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('User', userSchema);