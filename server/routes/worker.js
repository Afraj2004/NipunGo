const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { cloudinary, upload } = require('../config/cloudinary');

// ════════════════════════════════════════════════
// ⚠️ ROUTE ORDER — Specific pehle, Generic baad mein
// ════════════════════════════════════════════════

// ── 1. SABHI WORKERS ─────────────────────────────────────
router.get('/all', async (req, res) => {
  try {
    const filter = { role: 'worker' };
    if (req.query.service)  filter.service     = req.query.service;
    if (req.query.city)     filter.city        = req.query.city;
    if (req.query.available === 'true') filter.isAvailable = true;

    const workers = await User.find(filter).select('-password');
    res.json({ success: true, workers, count: workers.length });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error!',
      error: error.message
    });
  }
});

// ── 2. SERVICE KE HISAAB SE WORKERS ──────────────────────
router.get('/service/:serviceName', async (req, res) => {
  try {
    const workers = await User.find({
      role: 'worker',
      service: req.params.serviceName,
      isAvailable: true
    }).select('-password');

    res.json({ success: true, workers, count: workers.length });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error!',
      error: error.message
    });
  }
});

// ── 3. AVAILABILITY TOGGLE ────────────────────────────────
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

// ── 4. PROFILE UPDATE (Text Fields) ──────────────────────
router.put('/update/:workerId', async (req, res) => {
  try {
    const {
      service, city, price,
      experience, about
    } = req.body;

    // Validation
    if (!service) {
      return res.status(400).json({
        success: false,
        message: 'Service select karna zaroori hai!'
      });
    }

    if (price && (isNaN(price) || price < 0)) {
      return res.status(400).json({
        success: false,
        message: 'Valid price daalo!'
      });
    }

    const worker = await User.findByIdAndUpdate(
      req.params.workerId,
      {
        service: service.trim(),
        city: city?.trim() || '',
        price: Number(price) || 0,
        experience: experience?.trim() || '',
        about: about?.trim() || ''
      },
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

// ── 5. PHOTO UPLOAD ← NEW ─────────────────────────────────
router.put(
  '/upload-photo/:workerId',
  upload.single('photo'),      // 'photo' = form field name
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'Photo select karo!'
        });
      }

      const worker = await User.findById(req.params.workerId);

      if (!worker) {
        // Upload hui image delete karo
        await cloudinary.uploader.destroy(req.file.filename);
        return res.status(404).json({
          success: false,
          message: 'Worker nahi mila!'
        });
      }

      // Purani photo delete karo Cloudinary se
      if (worker.photoPublicId) {
        await cloudinary.uploader.destroy(worker.photoPublicId)
          .catch(err =>
            console.log('Old photo delete error:', err.message)
          );
      }

      // Naya photo save karo
      const updatedWorker = await User.findByIdAndUpdate(
        req.params.workerId,
        {
          photoUrl: req.file.path,        // Cloudinary URL
          photoPublicId: req.file.filename // Public ID
        },
        { new: true }
      ).select('-password');

      res.json({
        success: true,
        message: 'Photo upload ho gayi! 📸',
        worker: updatedWorker,
        photoUrl: req.file.path
      });

    } catch (error) {
      // Multer ya Cloudinary error
      if (error.message.includes('allowed')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }
      res.status(500).json({
        success: false,
        message: 'Photo upload nahi ho saki!',
        error: error.message
      });
    }
  }
);

// ── 6. PHOTO DELETE ← NEW ────────────────────────────────
router.delete('/delete-photo/:workerId', async (req, res) => {
  try {
    const worker = await User.findById(req.params.workerId);

    if (!worker) {
      return res.status(404).json({
        success: false,
        message: 'Worker nahi mila!'
      });
    }

    if (!worker.photoPublicId) {
      return res.status(400).json({
        success: false,
        message: 'Koi photo nahi hai delete karne ke liye!'
      });
    }

    // Cloudinary se delete karo
    await cloudinary.uploader.destroy(worker.photoPublicId);

    // DB update karo
    const updatedWorker = await User.findByIdAndUpdate(
      req.params.workerId,
      { photoUrl: '', photoPublicId: '' },
      { new: true }
    ).select('-password');

    res.json({
      success: true,
      message: 'Photo delete ho gayi!',
      worker: updatedWorker
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Photo delete nahi ho saki!',
      error: error.message
    });
  }
});

// ── 7. SINGLE WORKER PROFILE ──────────────────────────────
// ⚠️ SABSE LAST — generic route
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

    res.json({ success: true, worker });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error!',
      error: error.message
    });
  }
});

module.exports = router;