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
      price 
    } = req.body;

    const booking = await Booking.create({
      customer,
      worker,
      service,
      date,
      time,
      address,
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
      .populate('customer', 'name email')
      .populate('worker', 'name service');

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

module.exports = router;