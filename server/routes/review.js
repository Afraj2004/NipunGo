const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const User = require('../models/User');
const Booking = require('../models/Booking');
const { protect } = require('../middleware/auth');

router.use(protect);

// Review add karo
router.post('/add', async (req, res) => {
  try {
    const { booking, rating, comment } = req.body;

    const bookingDoc = booking && await Booking.findById(booking);
    if (!bookingDoc) {
      return res.status(404).json({ message: 'Booking nahi mili!' });
    }
    // Sirf booking ka customer, completed booking pe review de sakta hai
    if (String(bookingDoc.customer) !== String(req.user.id)) {
      return res.status(403).json({ message: 'Yeh aapki booking nahi hai!' });
    }
    if (bookingDoc.status !== 'Completed' || !bookingDoc.assignedWorker) {
      return res.status(400).json({
        message: 'Review sirf completed booking pe de sakte ho!'
      });
    }
    const numRating = Number(rating);
    if (!(numRating >= 1 && numRating <= 5)) {
      return res.status(400).json({ message: 'Rating 1 se 5 ke beech honi chahiye!' });
    }

    // Identity booking se aati hai, request body se nahi
    const customer = req.user.id;
    const worker = bookingDoc.assignedWorker;
    const service = bookingDoc.service;

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
      rating: numRating,
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