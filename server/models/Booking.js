const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({

  // ── Parties ────────────────────────────────
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // 👇 Worker pehle NULL rahega — accept karne par assign hoga
  assignedWorker: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },

  // 👇 Jinhe request gayi hai (saare free workers)
  pendingWorkers: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  ],

  // 👇 Jinne reject kiya
  rejectedWorkers: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  ],

  // ── Service Info ───────────────────────────
  service: {
    type: String,
    required: true
  },
  date: {
    type: String,
    required: true
  },
  time: {
    type: String,
    required: true
  },
  address: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  price: {
    type: Number,
    required: true
  },

  // ── Status ─────────────────────────────────
  status: {
    type: String,
    enum: [
      'Searching',   // 👈 Workers dhundh rahe hain
      'Confirmed',   // Worker ne accept kiya
      'Completed',   // Kaam ho gaya
      'Cancelled',   // Cancel ho gayi
      'No Workers'   // Koi worker available nahi tha
    ],
    default: 'Searching'
  },

  // ── Timestamps ─────────────────────────────
  acceptedAt: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Booking', bookingSchema);