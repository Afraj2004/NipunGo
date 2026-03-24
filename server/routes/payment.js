const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const crypto = require('crypto');

// Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_SECRET
});

// Order banao
router.post('/create-order', async (req, res) => {
  try {
    const { amount, bookingId } = req.body;

    const options = {
      amount: amount * 100, // Paise mein convert
      currency: 'INR',
      receipt: `booking_${bookingId}`,
      notes: {
        bookingId
      }
    };

    const order = await razorpay.orders.create(options);

    res.json({
      success: true,
      order,
      key: process.env.RAZORPAY_KEY_ID
    });

  } catch (error) {
    res.status(500).json({
      message: 'Payment Error!',
      error: error.message
    });
  }
});

// Payment verify karo
router.post('/verify', async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    } = req.body;

    // Signature verify karo
    const sign = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac('sha256', process.env.RAZORPAY_SECRET)
      .update(sign.toString())
      .digest('hex');

    if (razorpay_signature === expectedSign) {
      res.json({
        success: true,
        message: 'Payment Successful! 🎉',
        paymentId: razorpay_payment_id
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Payment Failed!'
      });
    }

  } catch (error) {
    res.status(500).json({
      message: 'Verification Error!',
      error: error.message
    });
  }
});

module.exports = router;