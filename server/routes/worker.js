const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Sabhi workers dekho
router.get('/all', async (req, res) => {
  try {
    const workers = await User.find({ 
      role: 'worker' 
    }).select('-password');

    res.json({
      success: true,
      workers
    });

  } catch (error) {
    res.status(500).json({
      message: 'Server Error!',
      error: error.message
    });
  }
});

// Service ke hisaab se workers
router.get('/service/:serviceName', async (req, res) => {
  try {
    const workers = await User.find({
      role: 'worker',
      service: req.params.serviceName
    }).select('-password');

    res.json({
      success: true,
      workers
    });

  } catch (error) {
    res.status(500).json({
      message: 'Server Error!',
      error: error.message
    });
  }
});

// Single worker profile
router.get('/:workerId', async (req, res) => {
  try {
    const worker = await User.findById(
      req.params.workerId
    ).select('-password');

    if (!worker) {
      return res.status(404).json({
        message: 'Worker nahi mila!'
      });
    }

    res.json({
      success: true,
      worker
    });

  } catch (error) {
    res.status(500).json({
      message: 'Server Error!',
      error: error.message
    });
  }
});

// Worker profile update
router.put('/update/:workerId', async (req, res) => {
  try {
    const { 
      service, 
      city, 
      price, 
      experience,
      about
    } = req.body;

    const worker = await User.findByIdAndUpdate(
      req.params.workerId,
      { 
        service, 
        city, 
        price,
        experience,
        about
      },
      { new: true }
    ).select('-password');

    res.json({
      success: true,
      message: 'Profile update ho gaya!',
      worker
    });

  } catch (error) {
    res.status(500).json({
      message: 'Server Error!',
      error: error.message
    });
  }
});

module.exports = router;