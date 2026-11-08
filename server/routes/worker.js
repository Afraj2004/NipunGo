// server/routes/worker.js

const express  = require('express');
const router   = express.Router();
const User     = require('../models/User');
const { cloudinary, upload } = require('../config/cloudinary');
const jwt = require('jsonwebtoken');
const { protect } = require('../middleware/auth');
const { SERVICE_PRICES } = require('../config/services');

// Public endpoints still want to know who is asking (if anyone) so that
// contact details are only shown to people who are allowed to see them.
const optionalAuth = async (req, res, next) => {
  req.user = null;
  try {
    const header = req.headers.authorization || '';
    if (header.startsWith('Bearer ')) {
      const decoded = jwt.verify(header.split(' ')[1], process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
    }
  } catch {
    // invalid/expired token -> treated as anonymous
  }
  next();
};

// Phone and email are private. Only the worker themself and admins ever see them;
// customers and workers talk through the booking (tracking, OTP codes), not each other's numbers.
const withContactRules = async (workerDoc, viewer) => {
  const worker = workerDoc.toObject ? workerDoc.toObject() : { ...workerDoc };
  const allowed =
    !!viewer && (viewer.role === 'admin' || String(viewer._id) === String(worker._id));
  if (!allowed) {
    delete worker.phone;
    delete worker.email;
  }
  return worker;
};

// Sirf khud worker (ya admin) apni profile badal sakta hai
const selfOrAdmin = (req, res, next) => {
  // worker tools are for workers (and admins) only, never for customer accounts
  if (req.user.role !== 'worker' && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Yeh sirf worker accounts ke liye hai!',
    });
  }
  if (String(req.params.workerId) !== String(req.user.id) &&
      req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Aap sirf apni profile badal sakte ho!',
    });
  }
  next();
};

// ════════════════════════════════════════════════
// ⚠️ ROUTE ORDER — Specific pehle, Generic baad mein
// ════════════════════════════════════════════════

// ── 0. SERVICE-WISE AVAILABLE WORKER COUNT (public) ──────
router.get('/availability', async (req, res) => {
  try {
    const rows = await User.aggregate([
      { $match: { role: 'worker', isAvailable: true } },
      { $group: { _id: '$service', count: { $sum: 1 } } },
    ]);
    const availability = {};
    rows.forEach((r) => { if (r._id) availability[r._id] = r.count; });
    res.json({ success: true, availability });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error!' });
  }
});

// ── 1. SABHI WORKERS ─────────────────────────────────────
router.get('/all', optionalAuth, async (req, res) => {
  try {
    const filter = { role: 'worker' };
    if (req.query.service)          filter.service     = req.query.service;
    if (req.query.city)             filter.city        = req.query.city;
    if (req.query.available === 'true') filter.isAvailable = true;

    const found = await User.find(filter).select('-password');
    const workers = await Promise.all(found.map((w) => withContactRules(w, req.user)));
    res.json({ success: true, workers, count: workers.length });

  } catch (error) {
    console.error('GET /all error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server Error!',
      error:   (process.env.NODE_ENV === 'development' ? error.message : undefined),
    });
  }
});

// ── 2. SERVICE KE HISAAB SE WORKERS ──────────────────────
router.get('/service/:serviceName', optionalAuth, async (req, res) => {
  try {
    const found = await User.find({
      role:        'worker',
      service:     req.params.serviceName,
      isAvailable: true,
    }).select('-password');

    const workers = await Promise.all(found.map((w) => withContactRules(w, req.user)));
    res.json({ success: true, workers, count: workers.length });

  } catch (error) {
    console.error('GET /service error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server Error!',
      error:   (process.env.NODE_ENV === 'development' ? error.message : undefined),
    });
  }
});

// ── 3. AVAILABILITY TOGGLE ────────────────────────────────
router.put('/availability/:workerId', protect, selfOrAdmin, async (req, res) => {
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
      error:   (process.env.NODE_ENV === 'development' ? error.message : undefined),
    });
  }
});

// ── 4. PROFILE UPDATE (Text Fields) ──────────────────────
router.put('/update/:workerId', protect, selfOrAdmin, async (req, res) => {
  try {
    const { service, city, price, experience, about } = req.body;

    if (
      typeof service !== 'string' ||
      !Object.prototype.hasOwnProperty.call(SERVICE_PRICES, service)
    ) {
      return res.status(400).json({
        success: false,
        message: 'Valid service select karo!',
      });
    }

    if (price !== undefined && price !== '' &&
        (isNaN(price) || Number(price) < 0)) {
      return res.status(400).json({
        success: false,
        message: 'Valid price daalo!',
      });
    }

    // Free-text fields must be text and are kept to a sensible length
    const text = (value, max) => (typeof value === 'string' ? value.trim().slice(0, max) : null);
    const fields = { city: text(city, 50), experience: text(experience, 40), about: text(about, 500) };
    for (const [name, value] of Object.entries(fields)) {
      const given = { city, experience, about }[name];
      if (given !== undefined && value === null) {
        return res.status(400).json({ success: false, message: `${name} sahi format mein likho!` });
      }
    }

    const update = { service };
    if (fields.city !== null) update.city = fields.city;
    if (fields.experience !== null) update.experience = fields.experience;
    if (fields.about !== null) update.about = fields.about;
    // The stored price is only changed when one is actually sent (the dashboard doesn't send it)
    if (price !== undefined && price !== '') update.price = Number(price);

    const worker = await User.findByIdAndUpdate(
      req.params.workerId,
      update,
      { returnDocument: 'after' }
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
      error:   (process.env.NODE_ENV === 'development' ? error.message : undefined),
    });
  }
});

// ── 5. PHOTO UPLOAD ───────────────────────────────────────
// ⚠️ Multer error middleware alag se handle karna padega
router.put(
  '/upload-photo/:workerId',
  protect,
  selfOrAdmin,
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
            .destroy(req.file.filename, { invalidate: true })
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
          .destroy(worker.photoPublicId, { invalidate: true })
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
        error:   (process.env.NODE_ENV === 'development' ? error.message : undefined),
      });
    }
  }
);

// ── 6. PHOTO DELETE ───────────────────────────────────────
router.delete('/delete-photo/:workerId', protect, selfOrAdmin, async (req, res) => {
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
      .destroy(worker.photoPublicId, { invalidate: true });
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
      error:   (process.env.NODE_ENV === 'development' ? error.message : undefined),
    });
  }
});

// ── 7. SINGLE WORKER PROFILE ──────────────────────────────
// ⚠️ SABSE LAST RAKHO — ye /:workerId generic hai,
//    upar ke specific routes ko match kar sakta hai
router.get('/:workerId', optionalAuth, async (req, res) => {
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

    res.json({ success: true, worker: await withContactRules(worker, req.user) });

  } catch (error) {
    console.error('GET /:workerId error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server Error!',
      error:   (process.env.NODE_ENV === 'development' ? error.message : undefined),
    });
  }
});

module.exports = router;