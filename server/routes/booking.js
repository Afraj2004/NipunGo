const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');

// Booking banao
router.post('/create', async (req, res) => {
  try {
    const {
      customer,
      worker,
      service,
      date,
      time,
      address,
      description,
      price
    } = req.body;

    const booking = await Booking.create({
      customer,
      worker,
      service,
      date,
      time,
      address,
      description,
      price
    });

    res.status(201).json({
      success: true,
      message: 'Booking ho gayi! 🎉',
      booking
    });

  } catch (error) {
    res.status(500).json({
      message: 'Server Error!',
      error: error.message
    });
  }
});

// Sabhi bookings dekho
router.get('/all', async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate('customer', 'name email phone')
      .populate('worker', 'name service phone')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      bookings
    });

  } catch (error) {
    res.status(500).json({
      message: 'Server Error!',
      error: error.message
    });
  }
});

// Customer ki bookings
router.get('/my-bookings/:customerId', async (req, res) => {
  try {
    const bookings = await Booking.find({
      customer: req.params.customerId
    })
      .populate('worker', 'name service phone city rating')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      bookings
    });

  } catch (error) {
    res.status(500).json({
      message: 'Server Error!',
      error: error.message
    });
  }
});

// Worker ki bookings 👈 New!
router.get('/worker-bookings/:workerId', async (req, res) => {
  try {
    const bookings = await Booking.find({
      worker: req.params.workerId
    })
      .populate('customer', 'name email phone')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      bookings
    });

  } catch (error) {
    res.status(500).json({
      message: 'Server Error!',
      error: error.message
    });
  }
});

// Single booking
router.get('/single/:bookingId', async (req, res) => {
  try {
    const booking = await Booking.findById(
      req.params.bookingId
    )
      .populate('customer', 'name email phone')
      .populate('worker', 'name service phone');

    if (!booking) {
      return res.status(404).json({
        message: 'Booking nahi mili!'
      });
    }

    res.json({
      success: true,
      booking
    });

  } catch (error) {
    res.status(500).json({
      message: 'Server Error!',
      error: error.message
    });
  }
});

// Booking status update
router.put('/status/:bookingId', async (req, res) => {
  try {
    const { status } = req.body;

    const booking = await Booking.findByIdAndUpdate(
      req.params.bookingId,
      { status },
      { new: true }
    );

    res.json({
      success: true,
      message: `Booking ${status} ho gayi!`,
      booking
    });

  } catch (error) {
    res.status(500).json({
      message: 'Server Error!',
      error: error.message
    });
  }
});

// Booking cancel
router.put('/cancel/:bookingId', async (req, res) => {
  try {
    const booking = await Booking.findByIdAndUpdate(
      req.params.bookingId,
      { status: 'Cancelled' },
      { new: true }
    );

    res.json({
      success: true,
      message: 'Booking cancel ho gayi!',
      booking
    });

  } catch (error) {
    res.status(500).json({
      message: 'Server Error!',
      error: error.message
    });
  }
});

// Worker booking accept/reject 👈 New!
router.put('/accept/:bookingId', async (req, res) => {
  try {
    const booking = await Booking.findByIdAndUpdate(
      req.params.bookingId,
      { status: 'Confirmed' },
      { new: true }
    ).populate('customer', 'name email phone');

    res.json({
      success: true,
      message: 'Booking Accept Ho Gayi! ✅',
      booking
    });

  } catch (error) {
    res.status(500).json({
      message: 'Server Error!',
      error: error.message
    });
  }
});

// Worker booking complete 👈 New!
router.put('/complete/:bookingId', async (req, res) => {
  try {
    const booking = await Booking.findByIdAndUpdate(
      req.params.bookingId,
      { status: 'Completed' },
      { new: true }
    );

    res.json({
      success: true,
      message: 'Booking Complete Ho Gayi! 🎉',
      booking
    });

  } catch (error) {
    res.status(500).json({
      message: 'Server Error!',
      error: error.message
    });
  }
});

module.exports = router;