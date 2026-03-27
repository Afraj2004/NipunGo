const express = require('express');
const router = express.Router();
const User = require('../models/User');

// ════════════════════════════════════════════════
// ⚠️  ORDER BAHUT IMPORTANT HAI
//    Specific routes → Generic routes
//    /all, /service/:x, /availability/:x  PEHLE
//    /:workerId  SABSE BAAD
// ════════════════════════════════════════════════

// ── 1. SABHI WORKERS ─────────────────────────────
router.get('/all', async (req, res) => {
  try {
    const filter = { role: 'worker' };

    if (req.query.service) filter.service = req.query.service;
    if (req.query.city)    filter.city    = req.query.city;
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

// ── 2. SERVICE KE HISAAB SE WORKERS ──────────────
router.get('/service/:serviceName', async (req, res) => {
  try {
    const workers = await User.find({
      role: 'worker',
      service: req.params.serviceName,
      isAvailable: true
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

// ── 3. AVAILABILITY TOGGLE ────────────────────────
//    ⚠️ '/:workerId' se PEHLE rakhna zaroori hai
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
        ? 'Aap ab Available hain! ✅'
        : 'Aap ab Unavailable hain ⏸️',
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

// ── 4. PROFILE UPDATE ─────────────────────────────
//    ⚠️ '/:workerId' se PEHLE rakhna zaroori hai
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

// ── 5. SINGLE WORKER PROFILE ──────────────────────
//    ⚠️ SABSE LAST MEIN — generic route hai
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

module.exports = router;