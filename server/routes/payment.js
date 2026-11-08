const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const crypto = require('crypto');
const Booking = require('../models/Booking');
const { protect } = require('../middleware/auth');
const { present } = require('../utils/bookingView');

router.use(protect);

const isDev = process.env.NODE_ENV === 'development';

// Razorpay signs "order_id|payment_id" with the key secret; anything else is a forgery
const signatureFor = (orderId, paymentId) =>
  crypto
    .createHmac('sha256', process.env.RAZORPAY_SECRET || '')
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

const signaturesMatch = (given, expected) => {
  if (typeof given !== 'string' || given.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(given), Buffer.from(expected));
};

// ════════════════════════════════════════════════
// 📌 1. CREATE AN ONLINE PAYMENT ORDER
//    Works any time before the booking is paid: when booking (pay now) or after the
//    service has ended (pay after service). The amount always comes from the booking.
// ════════════════════════════════════════════════
router.post('/create-order', async (req, res) => {
  try {
    const { bookingId } = req.body;
    const booking = typeof bookingId === 'string' && await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking nahi mili!' });
    }
    if (String(booking.customer) !== String(req.user.id)) {
      return res.status(403).json({ success: false, message: 'Yeh aapki booking nahi hai!' });
    }
    if (booking.paymentStatus === 'paid') {
      return res.status(400).json({ success: false, message: 'Is booking ka payment ho chuka hai!' });
    }
    if (['Cancelled', 'No Workers'].includes(booking.status)) {
      return res.status(400).json({ success: false, message: 'Is booking ke liye payment nahi ho sakta.' });
    }

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_SECRET
    });

    const order = await razorpay.orders.create({
      amount: Math.round(booking.price * 100),
      currency: 'INR',
      receipt: `booking_${booking._id}`,
      notes: { bookingId: String(booking._id) }
    });

    // Remember which order belongs to which booking, so /verify can match them up
    booking.razorpayOrderId = order.id;
    await booking.save();

    res.json({ success: true, order, key: process.env.RAZORPAY_KEY_ID });
  } catch (error) {
    console.error('Payment order error:', error?.error?.description || error.message);
    res.status(500).json({
      success: false,
      message: 'Online payment abhi available nahi hai. Aap cash se pay kar sakte ho, ya thodi der baad try karo.',
      ...(isDev ? { error: error.message } : {})
    });
  }
});

// ════════════════════════════════════════════════
// 📌 2. VERIFY THE PAYMENT AND RECORD IT ON THE BOOKING
// ════════════════════════════════════════════════
router.post('/verify', async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    if (typeof razorpay_order_id !== 'string' || typeof razorpay_payment_id !== 'string') {
      return res.status(400).json({ success: false, message: 'Payment details galat hain!' });
    }

    if (!signaturesMatch(razorpay_signature, signatureFor(razorpay_order_id, razorpay_payment_id))) {
      return res.status(400).json({ success: false, message: 'Payment verify nahi ho paya!' });
    }

    const booking = await Booking.findOne({ razorpayOrderId: razorpay_order_id });
    if (!booking || String(booking.customer) !== String(req.user.id)) {
      return res.status(404).json({ success: false, message: 'Is payment ki booking nahi mili!' });
    }

    // Idempotent: a repeated call (double click, retry) records it once
    const paid = await Booking.findOneAndUpdate(
      { _id: booking._id, paymentStatus: { $ne: 'paid' } }, // also matches older bookings with no field
      {
        paymentStatus: 'paid',
        paidVia: 'online',
        paidAt: new Date(),
        paidAmount: booking.price,
        razorpayPaymentId: razorpay_payment_id
      },
      { returnDocument: 'after' }
    );

    res.json({
      success: true,
      message: 'Payment Successful! 🎉',
      paymentId: razorpay_payment_id,
      booking: present(paid || booking, req.user)
    });
  } catch (error) {
    console.error('Payment verify error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Payment verify karte waqt error aaya. Paise kate hain to support se baat karo.',
      ...(isDev ? { error: error.message } : {})
    });
  }
});

module.exports = router;
module.exports.signatureFor = signatureFor;
