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
      'In Progress', // Start OTP verify hua, kaam chal raha hai
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
  onTheWayAt: { type: Date, default: null },   // worker tapped "On the way"
  startedAt: { type: Date, default: null },    // start OTP verified
  completedAt: { type: Date, default: null },  // end OTP verified
  cancelledAt: { type: Date, default: null },

  // ── Payment ────────────────────────────────
  // paymentMethod is what the customer chose when booking; they can still switch at the end.
  paymentMethod: { type: String, enum: ['cash', 'online'], default: 'cash' },
  paymentStatus: { type: String, enum: ['pending', 'paid'], default: 'pending' },
  paidVia: { type: String, enum: ['cash', 'online', null], default: null },
  paidAt: { type: Date, default: null },
  paidAmount: { type: Number, default: 0 },
  razorpayOrderId: { type: String, default: null },
  razorpayPaymentId: { type: String, default: null },

  // Who asked to see the other person's number, and when (internal audit trail)
  contactLog: [{ by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, at: { type: Date, default: Date.now } }],

  // Guessing protection for the 4-digit start/end codes
  otpFailures: { type: Number, default: 0 },
  otpLockedUntil: { type: Date, default: null },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Booking', bookingSchema);