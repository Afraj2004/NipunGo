// server/routes/worker.js

const express  = require('express');
const router   = express.Router();
const User     = require('../models/User');
const { cloudinary, upload } = require('../config/cloudinary');

// ════════════════════════════════════════════════
// ⚠️ ROUTE ORDER — Specific pehle, Generic baad mein
// ════════════════════════════════════════════════

// ── 1. SABHI WORKERS ─────────────────────────────────────
router.get('/all', async (req, res) => {
  try {
    const filter = { role: 'worker' };
    if (req.query.service)          filter.service     = req.query.service;
    if (req.query.city)             filter.city        = req.query.city;
    if (req.query.available === 'true') filter.isAvailable = true;

    const workers = await User.find(filter).select('-password');
    res.json({ success: true, workers, count: workers.length });

  } catch (error) {
    console.error('GET /all error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server Error!',
      error:   error.message,
    });
  }
});

// ── 2. SERVICE KE HISAAB SE WORKERS ──────────────────────
router.get('/service/:serviceName', async (req, res) => {
  try {
    const workers = await User.find({
      role:        'worker',
      service:     req.params.serviceName,
      isAvailable: true,
    }).select('-password');

    res.json({ success: true, workers, count: workers.length });

  } catch (error) {
    console.error('GET /service error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server Error!',
      error:   error.message,
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
        message: 'isAvailable true/false hona chahiye!',
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
        message: 'Worker nahi mila!',
      });
    }

    res.json({
      success: true,
      message: isAvailable
        ? 'Aap ab Available hain! ✅'
        : 'Aap ab Unavailable hain ⏸️',
      worker,
    });

  } catch (error) {
    console.error('PUT /availability error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server Error!',
      error:   error.message,
    });
  }
});

// ── 4. PROFILE UPDATE (Text Fields) ──────────────────────
router.put('/update/:workerId', async (req, res) => {
  try {
    const { service, city, price, experience, about } = req.body;

    if (!service || !service.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Service select karna zaroori hai!',
      });
    }

    if (price !== undefined && price !== '' &&
        (isNaN(price) || Number(price) < 0)) {
      return res.status(400).json({
        success: false,
        message: 'Valid price daalo!',
      });
    }

    const worker = await User.findByIdAndUpdate(
      req.params.workerId,
      {
        service:    service.trim(),
        city:       city?.trim()        || '',
        price:      Number(price)       || 0,
        experience: experience?.trim()  || '',
        about:      about?.trim()       || '',
      },
      { new: true }
    ).select('-password');

    if (!worker) {
      return res.status(404).json({
        success: false,
        message: 'Worker nahi mila!',
      });
    }

    res.json({
      success: true,
      message: 'Profile update ho gaya! 👍',
      worker,
    });

  } catch (error) {
    console.error('PUT /update error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server Error!',
      error:   error.message,
    });
  }
});

// ── 5. PHOTO UPLOAD ───────────────────────────────────────
// ⚠️ Multer error middleware alag se handle karna padega
router.put(
  '/upload-photo/:workerId',
  // ── Multer middleware — error pehle pakdo ──────────────
  (req, res, next) => {
    upload.single('photo')(req, res, (err) => {
      if (err) {
        console.error('Multer error:', err.message);

        // File size error
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            message: 'Photo 5MB se chhoti honi chahiye!',
          });
        }
        // File type error (cloudinary.js se throw hota hai)
        if (err.message?.includes('allowed')) {
          return res.status(400).json({
            success: false,
            message: 'Sirf JPG, PNG, WEBP images allowed hain!',
          });
        }
        // Koi bhi aur multer error
        return res.status(400).json({
          success: false,
          message: 'File upload error!',
          error:   err.message,
        });
      }
      // Koi error nahi — aage jao
      next();
    });
  },

  // ── Main Handler ───────────────────────────────────────
  async (req, res) => {
    try {
      // ── Debug logs ────────────────────────────────────
      console.log('=== PHOTO UPLOAD START ===');
      console.log('Worker ID :', req.params.workerId);
      console.log('File      :', req.file
        ? { path: req.file.path, filename: req.file.filename, size: req.file.size }
        : 'NO FILE'
      );

      // ── File check ────────────────────────────────────
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'Photo select karo! (JPG/PNG/WEBP, max 5MB)',
        });
      }

      // ── Worker DB mein dhundo ─────────────────────────
      const worker = await User.findById(req.params.workerId);
      if (!worker) {
        // Cloudinary pe already upload ho gayi — wapas delete karo
        if (req.file.filename) {
          await cloudinary.uploader
            .destroy(req.file.filename)
            .catch(e => console.log('Cleanup error:', e.message));
        }
        return res.status(404).json({
          success: false,
          message: 'Worker nahi mila!',
        });
      }

      // ── Purani photo Cloudinary se delete karo ────────
      if (worker.photoPublicId) {
        console.log('Deleting old photo:', worker.photoPublicId);
        await cloudinary.uploader
          .destroy(worker.photoPublicId)
          .catch(e => console.log('Old photo delete error:', e.message));
      }

      // ── Naya photo DB mein save karo ──────────────────
      const updatedWorker = await User.findByIdAndUpdate(
        req.params.workerId,
        {
          photoUrl:      req.file.path,      // Cloudinary HTTPS URL
          photoPublicId: req.file.filename,  // Public ID (delete ke liye)
        },
        { new: true }
      ).select('-password');

      console.log('Photo saved ✅:', req.file.path);
      console.log('=== PHOTO UPLOAD END ===');

      res.json({
        success:  true,
        message:  'Photo upload ho gayi! 📸',
        worker:   updatedWorker,
        photoUrl: req.file.path,
      });

    } catch (error) {
      console.error('Photo upload handler error:', error.message);
      res.status(500).json({
        success: false,
        message: 'Photo upload nahi ho saki!',
        error:   error.message,
      });
    }
  }
);

// ── 6. PHOTO DELETE ───────────────────────────────────────
router.delete('/delete-photo/:workerId', async (req, res) => {
  try {
    console.log('=== PHOTO DELETE START ===');
    console.log('Worker ID:', req.params.workerId);

    const worker = await User.findById(req.params.workerId);

    if (!worker) {
      return res.status(404).json({
        success: false,
        message: 'Worker nahi mila!',
      });
    }

    if (!worker.photoPublicId) {
      return res.status(400).json({
        success: false,
        message: 'Koi photo nahi hai delete karne ke liye!',
      });
    }

    // ── Cloudinary se delete karo ─────────────────────
    console.log('Deleting from Cloudinary:', worker.photoPublicId);
    const cloudResult = await cloudinary.uploader
      .destroy(worker.photoPublicId);
    console.log('Cloudinary delete result:', cloudResult);

    // ── DB update karo ────────────────────────────────
    const updatedWorker = await User.findByIdAndUpdate(
      req.params.workerId,
      { photoUrl: '', photoPublicId: '' },
      { new: true }
    ).select('-password');

    console.log('Photo deleted ✅');
    console.log('=== PHOTO DELETE END ===');

    res.json({
      success: true,
      message: 'Photo delete ho gayi!',
      worker:  updatedWorker,
    });

  } catch (error) {
    console.error('Photo delete error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Photo delete nahi ho saki!',
      error:   error.message,
    });
  }
});

// ── 7. SINGLE WORKER PROFILE ──────────────────────────────
// ⚠️ SABSE LAST RAKHO — ye /:workerId generic hai,
//    upar ke specific routes ko match kar sakta hai
router.get('/:workerId', async (req, res) => {
  try {
    const worker = await User.findById(
      req.params.workerId
    ).select('-password');

    if (!worker) {
      return res.status(404).json({
        success: false,
        message: 'Worker nahi mila!',
      });
    }

    res.json({ success: true, worker });

  } catch (error) {
    console.error('GET /:workerId error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server Error!',
      error:   error.message,
    });
  }
});

module.exports = router;