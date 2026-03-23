const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Booking = require('../models/Booking');

// Sabhi users dekho
router.get('/users', async (req, res) => {
  try {
    const users = await User.find()
      .select('-password')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      users
    });

  } catch (error) {
    res.status(500).json({
      message: 'Server Error!',
      error: error.message
    });
  }
});

// Sabhi bookings dekho
router.get('/bookings', async (req, res) => {
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

// Stats dekho
router.get('/stats', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ 
      role: 'customer' 
    });
    const totalWorkers = await User.countDocuments({ 
      role: 'worker' 
    });
    const totalBookings = await Booking.countDocuments();
    const pendingBookings = await Booking.countDocuments({ 
      status: 'Pending' 
    });
    const completedBookings = await Booking.countDocuments({ 
      status: 'Completed' 
    });
    const cancelledBookings = await Booking.countDocuments({ 
      status: 'Cancelled' 
    });

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalWorkers,
        totalBookings,
        pendingBookings,
        completedBookings,
        cancelledBookings
      }
    });

  } catch (error) {
    res.status(500).json({
      message: 'Server Error!',
      error: error.message
    });
  }
});

// Worker verify karo
router.put('/verify-worker/:workerId', async (req, res) => {
  try {
    const worker = await User.findByIdAndUpdate(
      req.params.workerId,
      { isVerified: true },
      { new: true }
    ).select('-password');

    res.json({
      success: true,
      message: 'Worker verify ho gaya! ✅',
      worker
    });

  } catch (error) {
    res.status(500).json({
      message: 'Server Error!',
      error: error.message
    });
  }
});

// Booking status update karo
router.put('/booking-status/:bookingId', async (req, res) => {
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

// User delete karo
router.delete('/user/:userId', async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.userId);

    res.json({
      success: true,
      message: 'User delete ho gaya!'
    });

  } catch (error) {
    res.status(500).json({
      message: 'Server Error!',
      error: error.message
    });
  }
});

module.exports = router;