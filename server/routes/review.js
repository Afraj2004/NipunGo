const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const User = require('../models/User');

// Review add karo
router.post('/add', async (req, res) => {
  try {
    const {
      booking,
      customer,
      worker,
      rating,
      comment,
      service
    } = req.body;

    // Check karo pehle se review hai ya nahi
    const existingReview = await Review.findOne({
      booking
    });

    if (existingReview) {
      return res.status(400).json({
        message: 'Is booking ka review pehle se hai!'
      });
    }

    // Review banao
    const review = await Review.create({
      booking,
      customer,
      worker,
      rating,
      comment,
      service
    });

    // Worker ki rating update karo
    const allReviews = await Review.find({ worker });
    const avgRating = allReviews.reduce(
      (sum, r) => sum + r.rating, 0
    ) / allReviews.length;

    await User.findByIdAndUpdate(worker, {
      rating: avgRating.toFixed(1),
      totalReviews: allReviews.length
    });

    res.status(201).json({
      success: true,
      message: 'Review add ho gaya! ⭐',
      review
    });

  } catch (error) {
    res.status(500).json({
      message: 'Server Error!',
      error: error.message
    });
  }
});

// Worker ke reviews dekho
router.get('/worker/:workerId', async (req, res) => {
  try {
    const reviews = await Review.find({
      worker: req.params.workerId
    })
      .populate('customer', 'name')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      reviews
    });

  } catch (error) {
    res.status(500).json({
      message: 'Server Error!',
      error: error.message
    });
  }
});

// Booking ka review check karo
router.get('/booking/:bookingId', async (req, res) => {
  try {
    const review = await Review.findOne({
      booking: req.params.bookingId
    });

    res.json({
      success: true,
      review
    });

  } catch (error) {
    res.status(500).json({
      message: 'Server Error!',
      error: error.message
    });
  }
});

module.exports = router;