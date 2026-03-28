const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Booking = require('../models/Booking');
const { protect, adminOnly } = require('../middleware/auth');
const { body, param, validationResult } = require('express-validator');

// ════════════════════════════════════════════════
// 📌 GLOBAL MIDDLEWARE
//    → Sabhi /api/admin/* routes ke liye
//    → protect + adminOnly dono lagenge
// ════════════════════════════════════════════════
router.use(protect);    // Step 1: Token check
router.use(adminOnly);  // Step 2: Admin role check

// ════════════════════════════════════════════════
// 📌 1. DASHBOARD STATS
// ════════════════════════════════════════════════
router.get('/stats', async (req, res) => {
  try {
    const [
      totalCustomers,
      totalWorkers,
      totalBookings,
      searchingBookings,
      confirmedBookings,
      completedBookings,
      cancelledBookings,
      verifiedWorkers,
      recentBookings
    ] = await Promise.all([
      User.countDocuments({ role: 'customer' }),
      User.countDocuments({ role: 'worker' }),
      Booking.countDocuments(),
      Booking.countDocuments({ status: 'Searching' }),
      Booking.countDocuments({ status: 'Confirmed' }),
      Booking.countDocuments({ status: 'Completed' }),
      Booking.countDocuments({ status: 'Cancelled' }),
      User.countDocuments({ role: 'worker', isVerified: true }),

      // Last 5 bookings
      Booking.find()
        .populate('customer', 'name email')
        .populate('assignedWorker', 'name service')
        .sort({ createdAt: -1 })
        .limit(5)
    ]);

    // Platform earnings (completed bookings ka 10%)
    const completedBookingsList = await Booking.find({
      status: 'Completed'
    }).select('price');

    const totalRevenue = completedBookingsList.reduce(
      (sum, b) => sum + (b.price || 0), 0
    );
    const platformEarnings = Math.round(totalRevenue * 0.10);

    res.json({
      success: true,
      stats: {
        users: {
          totalCustomers,
          totalWorkers,
          verifiedWorkers,
          unverifiedWorkers: totalWorkers - verifiedWorkers
        },
        bookings: {
          total: totalBookings,
          searching: searchingBookings,
          confirmed: confirmedBookings,
          completed: completedBookings,
          cancelled: cancelledBookings
        },
        revenue: {
          totalRevenue,
          platformEarnings,  // 10% commission
          currency: 'INR'
        },
        recentBookings
      }
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
// 📌 2. SABHI USERS DEKHO
// ════════════════════════════════════════════════
router.get('/users', async (req, res) => {
  try {
    // Optional filters
    const filter = {};
    if (req.query.role) filter.role = req.query.role;

    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      users,
      count: users.length
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
// 📌 3. SABHI BOOKINGS DEKHO
// ════════════════════════════════════════════════
router.get('/bookings', async (req, res) => {
  try {
    // Optional status filter
    const filter = {};
    if (req.query.status) filter.status = req.query.status;

    const bookings = await Booking.find(filter)
      .populate('customer', 'name email phone')
      .populate('assignedWorker', 'name service phone')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      bookings,
      count: bookings.length
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
// 📌 4. WORKER VERIFY KARO ✅
// ════════════════════════════════════════════════
router.put(
  '/verify-worker/:workerId',
  [
    param('workerId')
      .isMongoId()
      .withMessage('Valid worker ID chahiye!')
  ],
  async (req, res) => {
    // Validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: errors.array()[0].msg
      });
    }

    try {
      const worker = await User.findOne({
        _id: req.params.workerId,
        role: 'worker'
      });

      if (!worker) {
        return res.status(404).json({
          success: false,
          message: 'Worker nahi mila!'
        });
      }

      worker.isVerified = true;
      await worker.save();

      res.json({
        success: true,
        message: `${worker.name} verify ho gaya! ✅`,
        worker: {
          id: worker._id,
          name: worker.name,
          service: worker.service,
          isVerified: worker.isVerified
        }
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Server Error!',
        error: error.message
      });
    }
  }
);

// ════════════════════════════════════════════════
// 📌 5. BOOKING STATUS UPDATE KARO
// ════════════════════════════════════════════════
router.put(
  '/booking-status/:bookingId',
  [
    param('bookingId')
      .isMongoId()
      .withMessage('Valid booking ID chahiye!'),
    body('status')
      .notEmpty()
      .withMessage('Status required hai!')
      .isIn(['Searching', 'Confirmed', 'Completed', 'Cancelled', 'No Workers'])
      .withMessage('Valid status chahiye!')
  ],
  async (req, res) => {
    // Validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: errors.array()[0].msg
      });
    }

    try {
      const { status } = req.body;

      const booking = await Booking.findByIdAndUpdate(
        req.params.bookingId,
        { status },
        { new: true }
      ).populate('customer', 'name email');

      if (!booking) {
        return res.status(404).json({
          success: false,
          message: 'Booking nahi mili!'
        });
      }

      res.json({
        success: true,
        message: `Booking status → ${status} ✅`,
        booking
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Server Error!',
        error: error.message
      });
    }
  }
);

// ════════════════════════════════════════════════
// 📌 6. USER DELETE KARO ⚠️
// ════════════════════════════════════════════════
router.delete(
  '/user/:userId',
  [
    param('userId')
      .isMongoId()
      .withMessage('Valid user ID chahiye!')
  ],
  async (req, res) => {
    // Validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: errors.array()[0].msg
      });
    }

    try {
      // Admin khud ko delete nahi kar sakta
      if (req.params.userId === req.user._id.toString()) {
        return res.status(400).json({
          success: false,
          message: 'Aap khud ko delete nahi kar sakte!'
        });
      }

      const user = await User.findByIdAndDelete(req.params.userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User nahi mila!'
        });
      }

      res.json({
        success: true,
        message: `${user.name} delete ho gaya!`
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Server Error!',
        error: error.message
      });
    }
  }
);

// ════════════════════════════════════════════════
// 📌 7. ADMIN BANAO (Super Admin only) 🔐
// ════════════════════════════════════════════════
router.put(
  '/make-admin/:userId',
  [
    param('userId')
      .isMongoId()
      .withMessage('Valid user ID chahiye!')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: errors.array()[0].msg
      });
    }

    try {
      const user = await User.findByIdAndUpdate(
        req.params.userId,
        { role: 'admin' },
        { new: true }
      ).select('-password');

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User nahi mila!'
        });
      }

      res.json({
        success: true,
        message: `${user.name} ab Admin hai! 👑`,
        user
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Server Error!',
        error: error.message
      });
    }
  }
);

module.exports = router;