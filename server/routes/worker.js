const express = require('express');
const router = express.Router();
const User = require('../models/User');

// ════════════════════════════════════════════════
// 📌 1. SABHI WORKERS DEKHO
// ════════════════════════════════════════════════
router.get('/all', async (req, res) => {
  try {
    // Optional filters: ?service=Plumber&city=Delhi&available=true
    const filter = { role: 'worker' };

    if (req.query.service) filter.service = req.query.service;
    if (req.query.city) filter.city = req.query.city;
    if (req.query.available === 'true') filter.isAvailable = true;

    const workers = await User.find(filter).select('-password');

    res.json({
      success: true,
      workers,
      count: workers.length
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error!',
      error: error.message
    });
  }
});

// ════════════════════════════════════════════════
// 📌 2. SERVICE KE HISAAB SE WORKERS
// ════════════════════════════════════════════════
router.get('/service/:serviceName', async (req, res) => {
  try {
    const workers = await User.find({
      role: 'worker',
      service: req.params.serviceName,
      isAvailable: true   // 👈 Sirf available workers
    }).select('-password');

    res.json({
      success: true,
      workers,
      count: workers.length
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error!',
      error: error.message
    });
  }
});

// ════════════════════════════════════════════════
// 📌 3. WORKER AVAILABILITY TOGGLE ← NEW!
//    Worker khud on/off kar sakta hai
// ════════════════════════════════════════════════
router.put('/availability/:workerId', async (req, res) => {
  try {
    const { isAvailable } = req.body;

    if (typeof isAvailable !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'isAvailable true/false hona chahiye!'
      });
    }

    const worker = await User.findByIdAndUpdate(
      req.params.workerId,
      { isAvailable },
      { new: true }
    ).select('-password');

    if (!worker) {
      return res.status(404).json({
        success: false,
        message: 'Worker nahi mila!'
      });
    }

    res.json({
      success: true,
      message: isAvailable
        ? 'Aap ab Available hain! Requests aana shuru hongi ✅'
        : 'Aap ab Unavailable hain. Koi request nahi aayegi ⏸️',
      worker
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error!',
      error: error.message
    });
  }
});

// ════════════════════════════════════════════════
// 📌 4. SINGLE WORKER PROFILE
// ════════════════════════════════════════════════
router.get('/:workerId', async (req, res) => {
  try {
    const worker = await User.findById(
      req.params.workerId
    ).select('-password');

    if (!worker) {
      return res.status(404).json({
        success: false,
        message: 'Worker nahi mila!'
      });
    }

    res.json({
      success: true,
      worker
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error!',
      error: error.message
    });
  }
});

// ════════════════════════════════════════════════
// 📌 5. WORKER PROFILE UPDATE
// ════════════════════════════════════════════════
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
      { service, city, price, experience, about },
      { new: true }
    ).select('-password');

    if (!worker) {
      return res.status(404).json({
        success: false,
        message: 'Worker nahi mila!'
      });
    }

    res.json({
      success: true,
      message: 'Profile update ho gaya! 👍',
      worker
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error!',
      error: error.message
    });
  }
});

module.exports = router;