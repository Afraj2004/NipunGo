const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const User = require('../models/User');

// ════════════════════════════════════════════════
// 📌 1. BOOKING BANAO
//    → Service ke saare free workers ko request bhejo
// ════════════════════════════════════════════════
router.post('/create', async (req, res) => {
  try {
    const {
      customerId,
      service,
      date,
      time,
      address,
      description,
      price
    } = req.body;

    // ── Validation ──────────────────────────
    if (!customerId || !service || !date || !time || !address || !price) {
      return res.status(400).json({
        success: false,
        message: 'Saari details bharo! (customerId, service, date, time, address, price)'
      });
    }

    // ── Step 1: Available workers dhundo ────
    //    Same service + isAvailable = true
    const availableWorkers = await User.find({
      role: 'worker',
      service: service,        // same service
      isAvailable: true        // free hain
    }).select('_id name');

    if (availableWorkers.length === 0) {
      // Koi worker free nahi → booking save karo "No Workers" status ke saath
      const booking = await Booking.create({
        customer: customerId,
        service,
        date,
        time,
        address,
        description: description || '',
        price,
        status: 'No Workers',
        pendingWorkers: []
      });

      return res.status(200).json({
        success: false,
        message: 'Abhi koi worker available nahi hai. Thodi der baad try karo!',
        booking
      });
    }

    // ── Step 2: Worker IDs nikalo ────────────
    const workerIds = availableWorkers.map(w => w._id);

    // ── Step 3: Booking banao ────────────────
    const booking = await Booking.create({
      customer: customerId,
      service,
      date,
      time,
      address,
      description: description || '',
      price,
      status: 'Searching',
      pendingWorkers: workerIds,  // saare free workers
      assignedWorker: null
    });

    // ── Step 4: Response bhejo ────────────────
    res.status(201).json({
      success: true,
      message: `Booking request ${availableWorkers.length} workers ko bheji gayi! ✅`,
      booking,
      workersNotified: availableWorkers.length
    });

  } catch (error) {
    console.error('Booking create error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error!',
      error: error.message
    });
  }
});

// ════════════════════════════════════════════════
// 📌 2. WORKER — PENDING REQUESTS DEKHO
//    → Worker ka dashboard — uske paas jo requests aai hain
// ════════════════════════════════════════════════
router.get('/worker-requests/:workerId', async (req, res) => {
  try {
    const { workerId } = req.params;

    // Wo bookings jahan:
    // 1. Worker pendingWorkers mein hai
    // 2. Status abhi bhi 'Searching' hai
    const requests = await Booking.find({
      pendingWorkers: workerId,
      status: 'Searching'
    })
      .populate('customer', 'name phone email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      requests,
      count: requests.length
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
// 📌 3. WORKER — BOOKING ACCEPT KARO ✅
//    → Is worker ko assign karo
//    → Baaki workers ki pending list se hatao
//    → Status → Confirmed
// ════════════════════════════════════════════════
router.put('/accept/:bookingId', async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { workerId } = req.body;

    if (!workerId) {
      return res.status(400).json({
        success: false,
        message: 'workerId required hai!'
      });
    }

    // ── Check: Booking exist karti hai? ─────
    const existingBooking = await Booking.findById(bookingId);

    if (!existingBooking) {
      return res.status(404).json({
        success: false,
        message: 'Booking nahi mili!'
      });
    }

    // ── Check: Koi aur pehle accept kar chuka? ─
    if (existingBooking.status !== 'Searching') {
      return res.status(400).json({
        success: false,
        message: 'Yeh booking already kisi aur ne accept kar li! ⚠️'
      });
    }

    // ── Check: Yeh worker is booking mein tha? ─
    const isValidWorker = existingBooking.pendingWorkers
      .map(id => id.toString())
      .includes(workerId);

    if (!isValidWorker) {
      return res.status(403).json({
        success: false,
        message: 'Aap is booking ke liye authorized nahi hain!'
      });
    }

    // ── Update Booking ───────────────────────
    const booking = await Booking.findByIdAndUpdate(
      bookingId,
      {
        status: 'Confirmed',
        assignedWorker: workerId,
        pendingWorkers: [],         // saaf karo — kisi aur ko dikhne ki zaroorat nahi
        acceptedAt: new Date()
      },
      { new: true }
    )
      .populate('customer', 'name phone email address')
      .populate('assignedWorker', 'name phone service city rating price');

    // ── Worker ko busy mark karo (optional) ──
    // await User.findByIdAndUpdate(workerId, { isAvailable: false });

    res.json({
      success: true,
      message: 'Booking Accept Ho Gayi! Kaam shuru karo! 🎉',
      booking
    });

  } catch (error) {
    console.error('Accept error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error!',
      error: error.message
    });
  }
});

// ════════════════════════════════════════════════
// 📌 4. WORKER — BOOKING REJECT KARO ❌
//    → Is worker ko pendingWorkers se hatao
//    → Baaki workers ko dikhta rahega
// ════════════════════════════════════════════════
router.put('/reject/:bookingId', async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { workerId } = req.body;

    if (!workerId) {
      return res.status(400).json({
        success: false,
        message: 'workerId required hai!'
      });
    }

    const booking = await Booking.findByIdAndUpdate(
      bookingId,
      {
        // pendingWorkers se is worker ko hatao
        $pull: { pendingWorkers: workerId },
        // rejectedWorkers mein daalo
        $push: { rejectedWorkers: workerId }
      },
      { new: true }
    );

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking nahi mili!'
      });
    }

    // ── Agar saare workers ne reject kar diya ──
    if (booking.pendingWorkers.length === 0 && booking.status === 'Searching') {
      await Booking.findByIdAndUpdate(bookingId, {
        status: 'No Workers'
      });

      return res.json({
        success: true,
        message: 'Rejected. Saare workers ne reject kar diya — customer ko notify karo.',
        allRejected: true
      });
    }

    res.json({
      success: true,
      message: 'Request reject ho gayi.',
      remainingWorkers: booking.pendingWorkers.length
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
// 📌 5. CUSTOMER — APNI BOOKINGS DEKHO
// ════════════════════════════════════════════════
router.get('/my-bookings/:customerId', async (req, res) => {
  try {
    const bookings = await Booking.find({
      customer: req.params.customerId
    })
      .populate(
        'assignedWorker',
        'name service phone city rating price experience'
      )
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      bookings
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
// 📌 6. WORKER — APNI CONFIRMED/COMPLETED BOOKINGS
// ════════════════════════════════════════════════
router.get('/worker-bookings/:workerId', async (req, res) => {
  try {
    const bookings = await Booking.find({
      assignedWorker: req.params.workerId,
      status: { $in: ['Confirmed', 'Completed', 'Cancelled'] }
    })
      .populate('customer', 'name email phone')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      bookings
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
// 📌 7. SINGLE BOOKING DETAIL
// ════════════════════════════════════════════════
router.get('/single/:bookingId', async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.bookingId)
      .populate('customer', 'name email phone')
      .populate(
        'assignedWorker',
        'name service phone city rating price experience about'
      );

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking nahi mili!'
      });
    }

    res.json({
      success: true,
      booking
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
// 📌 8. WORKER — BOOKING COMPLETE KARO
// ════════════════════════════════════════════════
router.put('/complete/:bookingId', async (req, res) => {
  try {
    const booking = await Booking.findByIdAndUpdate(
      req.params.bookingId,
      { status: 'Completed' },
      { new: true }
    )
      .populate('customer', 'name phone')
      .populate('assignedWorker', 'name phone');

    // ── Worker wapas available ho jaye ───────
    if (booking.assignedWorker) {
      await User.findByIdAndUpdate(
        booking.assignedWorker._id,
        { isAvailable: true }
      );
    }

    res.json({
      success: true,
      message: 'Kaam complete ho gaya! Bahut badhiya! 🌟',
      booking
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
// 📌 9. CUSTOMER — BOOKING CANCEL KARO
// ════════════════════════════════════════════════
router.put('/cancel/:bookingId', async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.bookingId);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking nahi mili!'
      });
    }

    if (booking.status === 'Completed') {
      return res.status(400).json({
        success: false,
        message: 'Completed booking cancel nahi ho sakti!'
      });
    }

    const updatedBooking = await Booking.findByIdAndUpdate(
      req.params.bookingId,
      {
        status: 'Cancelled',
        pendingWorkers: []   // request saaf karo
      },
      { new: true }
    );

    res.json({
      success: true,
      message: 'Booking cancel ho gayi!',
      booking: updatedBooking
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
// 📌 10. ADMIN — SABHI BOOKINGS
// ════════════════════════════════════════════════
router.get('/all', async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate('customer', 'name email phone')
      .populate('assignedWorker', 'name service phone')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      bookings,
      total: bookings.length
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