const crypto = require('crypto');

// 4-digit codes for starting and finishing a job.
//
// They are derived from (booking id, kind) with the server secret, so nothing is
// stored: only the customer is ever shown them (GET /booking/single/:id) and the
// server recomputes them to check what the worker typed. Start and end codes differ.
// Online guessing is limited by a lock-out on the booking (see routes/booking.js).
const deriveOtp = (bookingId, kind) => {
  const digest = crypto
    .createHmac('sha256', process.env.JWT_SECRET || 'dev-only-secret')
    .update(`booking-otp:${kind}:${String(bookingId)}`)
    .digest();
  return String(digest.readUInt32BE(0) % 10000).padStart(4, '0');
};

const verifyBookingOtp = (bookingId, kind, submitted) => {
  if (typeof submitted !== 'string' || !/^\d{4}$/.test(submitted)) return false;
  const a = Buffer.from(deriveOtp(bookingId, kind));
  const b = Buffer.from(submitted);
  return crypto.timingSafeEqual(a, b);
};

module.exports = { deriveOtp, verifyBookingOtp };
