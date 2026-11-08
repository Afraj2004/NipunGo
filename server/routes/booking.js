const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const User = require('../models/User');
const {
  sendBookingCreatedEmail,
  sendWorkerAssignedEmail,
  sendNewJobEmail,
  sendBookingCompletedEmail,
  sendBookingCancelledEmail
} = require('../utils/emailService'); // 👈 NEW
const { protect, adminOnly } = require('../middleware/auth');
const { getBookingTotal } = require('../config/services');
const { deriveOtp, verifyBookingOtp } = require('../utils/bookingOtp');

// Har booking route pe login zaroori hai
router.use(protect);

const isAdmin = (req) => req.user.role === 'admin';
const sameId = (a, b) => String(a?._id || a) === String(b?._id || b);
const forbid = (res) => res.status(403).json({
  success: false,
  message: 'Aapko is action ki permission nahi hai!'
});

// ════════════════════════════════════════════════
// 📌 1. BOOKING BANAO
// ════════════════════════════════════════════════
router.post('/create', async (req, res) => {
  try {
    // Only customers book. (A worker booking their own service could accept their own request.)
    if (req.user.role !== 'customer') {
      return res.status(403).json({
        success: false,
        message: 'Booking sirf customer account se ho sakti hai!'
      });
    }
    const customerId = req.user.id;
    const {
      service, date,
      time, address, description
    } = req.body;

    // Price server decide karta hai — client pe bharosa nahi
    const price = getBookingTotal(service);
    if (price === null) {
      return res.status(400).json({
        success: false,
        message: 'Yeh service available nahi hai!'
      });
    }

    if (!customerId || !service || !date ||
        !time || !address || !price) {
      return res.status(400).json({
        success: false,
        message: 'Saari details bharo!'
      });
    }

    const availableWorkers = await User.find({
      role: 'worker',
      service: service,
      isAvailable: true
    }).select('_id name');

    if (availableWorkers.length === 0) {
      // Koi record nahi banate — customer ki history saaf rahe
      return res.status(200).json({
        success: false,
        noWorkers: true,
        message: `Abhi ${service} ka koi worker available nahi hai. ` +
          'Thodi der baad try karo ya koi aur service dekho.'
      });
    }

    const workerIds = availableWorkers.map(w => w._id);

    const booking = await Booking.create({
      customer: customerId,
      service, date, time, address,
      description: description || '',
      price, status: 'Searching',
      pendingWorkers: workerIds,
      assignedWorker: null
    });

    // 👇 Customer ko email bhejo
    const customer = await User.findById(customerId)
      .select('name email');

    if (customer?.email) {
      sendBookingCreatedEmail({
        customerName: customer.name,
        customerEmail: customer.email,
        service, date, time, address, price,
        bookingId: booking._id,
        workersNotified: availableWorkers.length
      }).catch(err =>
        console.log('Booking email error:', err.message)
      );
    }

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
      error: (process.env.NODE_ENV === 'development' ? error.message : undefined)
    });
  }
});

// ════════════════════════════════════════════════
// 📌 2. WORKER REQUESTS
// ════════════════════════════════════════════════
router.get('/worker-requests/:workerId', async (req, res) => {
  try {
    if (!sameId(req.params.workerId, req.user.id) && !isAdmin(req)) {
      return forbid(res);
    }
    const requests = await Booking.find({
      pendingWorkers: req.params.workerId,
      status: 'Searching'
    })
      .populate('customer', 'name phone email')
      .sort({ createdAt: -1 });

    res.json({ success: true, requests, count: requests.length });

  } catch (error) {
    res.status(500).json({
      success: false, message: 'Server Error!',
      error: (process.env.NODE_ENV === 'development' ? error.message : undefined)
    });
  }
});

// ════════════════════════════════════════════════
// 📌 3. BOOKING ACCEPT
// ════════════════════════════════════════════════
router.put('/accept/:bookingId', async (req, res) => {
  try {
    if (req.user.role !== 'worker') return forbid(res);
    const { bookingId } = req.params;
    const workerId = req.user.id;

    if (!workerId) {
      return res.status(400).json({
        success: false,
        message: 'workerId required hai!'
      });
    }

    const existingBooking = await Booking.findById(bookingId);

    if (!existingBooking) {
      return res.status(404).json({
        success: false,
        message: 'Booking nahi mili!'
      });
    }

    if (existingBooking.status !== 'Searching') {
      return res.status(400).json({
        success: false,
        message: 'Yeh booking already accept ho chuki hai!'
      });
    }

    const isValidWorker = existingBooking.pendingWorkers
      .map(id => id.toString())
      .includes(workerId);

    if (!isValidWorker) {
      return res.status(403).json({
        success: false,
        message: 'Aap is booking ke liye authorized nahi hain!'
      });
    }

    const booking = await Booking.findByIdAndUpdate(
      bookingId,
      {
        status: 'Confirmed',
        assignedWorker: workerId,
        pendingWorkers: [],
        acceptedAt: new Date()
      },
      { new: true }
    )
      .populate('customer', 'name phone email')
      .populate(
        'assignedWorker',
        'name phone email service city rating price experience'
      );

    // 👇 Customer + Worker dono ko email
    const { customer, assignedWorker } = booking;

    if (customer?.email) {
      sendWorkerAssignedEmail({
        customerName: customer.name,
        customerEmail: customer.email,
        service: booking.service,
        date: booking.date,
        time: booking.time,
        address: booking.address,
        price: booking.price,
        bookingId: booking._id,
        workerName: assignedWorker.name,
        workerPhone: assignedWorker.phone,
        workerCity: assignedWorker.city,
        workerRating: assignedWorker.rating,
        workerExperience: assignedWorker.experience
      }).catch(err =>
        console.log('Worker assigned email error:', err.message)
      );
    }

    if (assignedWorker?.email) {
      sendNewJobEmail({
        workerName: assignedWorker.name,
        workerEmail: assignedWorker.email,
        service: booking.service,
        date: booking.date,
        time: booking.time,
        address: booking.address,
        price: booking.price,
        bookingId: booking._id,
        customerName: customer.name,
        customerPhone: customer.phone
      }).catch(err =>
        console.log('New job email error:', err.message)
      );
    }

    res.json({
      success: true,
      message: 'Booking Accept Ho Gayi! 🎉',
      booking
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error!',
      error: (process.env.NODE_ENV === 'development' ? error.message : undefined)
    });
  }
});

// ════════════════════════════════════════════════
// 📌 4. BOOKING REJECT
// ════════════════════════════════════════════════
router.put('/reject/:bookingId', async (req, res) => {
  try {
    if (req.user.role !== 'worker') return forbid(res);
    const { bookingId } = req.params;
    const workerId = req.user.id;

    if (!workerId) {
      return res.status(400).json({
        success: false,
        message: 'workerId required hai!'
      });
    }

    const booking = await Booking.findByIdAndUpdate(
      bookingId,
      {
        $pull: { pendingWorkers: workerId },
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

    if (booking.pendingWorkers.length === 0 &&
        booking.status === 'Searching') {
      await Booking.findByIdAndUpdate(bookingId, {
        status: 'No Workers'
      });

      return res.json({
        success: true,
        message: 'Saare workers ne reject kar diya.',
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
      error: (process.env.NODE_ENV === 'development' ? error.message : undefined)
    });
  }
});

// ════════════════════════════════════════════════
// 📌 5. MY BOOKINGS
// ════════════════════════════════════════════════
router.get('/my-bookings/:customerId', async (req, res) => {
  try {
    if (!sameId(req.params.customerId, req.user.id) && !isAdmin(req)) {
      return forbid(res);
    }
    const bookings = await Booking.find({
      customer: req.params.customerId
    })
      .populate(
        'assignedWorker',
        'name service phone city rating price experience'
      )
      .sort({ createdAt: -1 });

    res.json({ success: true, bookings });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error!',
      error: (process.env.NODE_ENV === 'development' ? error.message : undefined)
    });
  }
});

// ════════════════════════════════════════════════
// 📌 6. WORKER BOOKINGS
// ════════════════════════════════════════════════
router.get('/worker-bookings/:workerId', async (req, res) => {
  try {
    if (!sameId(req.params.workerId, req.user.id) && !isAdmin(req)) {
      return forbid(res);
    }
    const bookings = await Booking.find({
      assignedWorker: req.params.workerId,
      status: { $in: ['Confirmed', 'In Progress', 'Completed', 'Cancelled'] }
    })
      .populate('customer', 'name email phone')
      .sort({ createdAt: -1 });

    res.json({ success: true, bookings });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error!',
      error: (process.env.NODE_ENV === 'development' ? error.message : undefined)
    });
  }
});

// ════════════════════════════════════════════════
// 📌 7. SINGLE BOOKING
// ════════════════════════════════════════════════
router.get('/single/:bookingId', async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.bookingId)
      .populate('customer', 'name email phone')
      .populate(
        'assignedWorker',
        'name service phone city rating price experience about photoUrl'
      );

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking nahi mili!'
      });
    }

    const involved =
      sameId(booking.customer, req.user.id) ||
      sameId(booking.assignedWorker, req.user.id) ||
      (booking.pendingWorkers || []).some(w => sameId(w, req.user.id));
    if (!involved && !isAdmin(req)) return forbid(res);

    const data = booking.toObject();
    if (sameId(booking.customer, req.user.id)) {
      data.otps = {};
      if (booking.status === 'Confirmed') data.otps.start = deriveOtp(booking._id, 'start');
      if (booking.status === 'In Progress') data.otps.end = deriveOtp(booking._id, 'end');
    }

    res.json({ success: true, booking: data });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error!',
      error: (process.env.NODE_ENV === 'development' ? error.message : undefined)
    });
  }
});

// ════════════════════════════════════════════════
// 📌 8. BOOKING COMPLETE
// ════════════════════════════════════════════════
router.put('/complete/:bookingId', adminOnly, async (req, res) => {
  try {
    const existing = await Booking.findById(req.params.bookingId);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Booking nahi mili!'
      });
    }
    if (!['Confirmed', 'In Progress'].includes(existing.status)) {
      return res.status(400).json({
        success: false,
        message: 'Sirf confirmed ya chal rahi booking complete ho sakti hai!'
      });
    }

    const booking = await Booking.findByIdAndUpdate(
      req.params.bookingId,
      { status: 'Completed', completedAt: new Date() },
      { new: true }
    )
      .populate('customer', 'name phone email')
      .populate('assignedWorker', 'name phone');

    if (booking.assignedWorker) {
      await User.findByIdAndUpdate(
        booking.assignedWorker._id,
        { isAvailable: true }
      );
    }

    // 👇 Customer ko completion email
    if (booking.customer?.email) {
      sendBookingCompletedEmail({
        customerName: booking.customer.name,
        customerEmail: booking.customer.email,
        workerName: booking.assignedWorker?.name || 'Worker',
        service: booking.service,
        date: booking.date,
        price: booking.price,
        bookingId: booking._id
      }).catch(err =>
        console.log('Complete email error:', err.message)
      );
    }

    res.json({
      success: true,
      message: 'Kaam complete ho gaya! 🌟',
      booking
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error!',
      error: (process.env.NODE_ENV === 'development' ? error.message : undefined)
    });
  }
});

// ════════════════════════════════════════════════
// 📌 9. BOOKING CANCEL
// ════════════════════════════════════════════════
router.put('/cancel/:bookingId', async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.bookingId)
      .populate('customer', 'name email');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking nahi mili!'
      });
    }

    if (
      !sameId(booking.customer, req.user.id) &&
      !sameId(booking.assignedWorker, req.user.id) &&
      !isAdmin(req)
    ) return forbid(res);

    if (booking.status === 'Completed') {
      return res.status(400).json({
        success: false,
        message: 'Completed booking cancel nahi ho sakti!'
      });
    }
    if (booking.status === 'Cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Yeh booking pehle hi cancel ho chuki hai!'
      });
    }
    if (booking.status === 'In Progress' && !isAdmin(req)) {
      return res.status(400).json({
        success: false,
        message: 'Kaam shuru ho chuka hai. Cancel karne ke liye support se baat karo.'
      });
    }

    const updatedBooking = await Booking.findByIdAndUpdate(
      req.params.bookingId,
      { status: 'Cancelled', pendingWorkers: [], cancelledAt: new Date() },
      { new: true }
    );

    // 👇 Customer ko cancel email
    if (booking.customer?.email) {
      sendBookingCancelledEmail({
        customerName: booking.customer.name,
        customerEmail: booking.customer.email,
        service: booking.service,
        date: booking.date,
        price: booking.price
      }).catch(err =>
        console.log('Cancel email error:', err.message)
      );
    }

    res.json({
      success: true,
      message: 'Booking cancel ho gayi!',
      booking: updatedBooking
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error!',
      error: (process.env.NODE_ENV === 'development' ? error.message : undefined)
    });
  }
});

// ════════════════════════════════════════════════
// 📌 10. ALL BOOKINGS (ADMIN)
// ════════════════════════════════════════════════
router.get('/all', adminOnly, async (req, res) => {
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
      error: (process.env.NODE_ENV === 'development' ? error.message : undefined)
    });
  }
});

// ════════════════════════════════════════════════
// 📌 SERVICE TRACKING: on the way -> start OTP -> end OTP
// ════════════════════════════════════════════════
const MAX_OTP_TRIES = 5;
const LOCK_MINUTES = 15;

// Only the assigned worker may move their own job along
const loadMyJob = async (req, res) => {
  const booking = await Booking.findById(req.params.bookingId);
  if (!booking) {
    res.status(404).json({ success: false, message: 'Booking nahi mili!' });
    return null;
  }
  if (!sameId(booking.assignedWorker, req.user.id)) {
    forbid(res);
    return null;
  }
  return booking;
};

// Reserve one guess atomically *before* checking the code, so a burst of parallel
// requests can't test more than MAX_OTP_TRIES codes between lock-outs.
// Returns { ok } when the code is right, otherwise sends the error response itself.
const checkBookingCode = async (res, booking, kind, code) => {
  const now = new Date();
  const reserved = await Booking.findOneAndUpdate(
    {
      _id: booking._id,
      $or: [{ otpLockedUntil: null }, { otpLockedUntil: { $lte: now } }]
    },
    { $inc: { otpFailures: 1 } },
    { returnDocument: 'after' }
  );

  const lockNow = () => Booking.updateOne(
    { _id: booking._id },
    { otpLockedUntil: new Date(Date.now() + LOCK_MINUTES * 60 * 1000), otpFailures: 0 }
  );

  if (!reserved) {
    res.status(429).json({
      success: false,
      message: `Bahut zyada galat OTP. ${LOCK_MINUTES} minute baad dobara try karo.`
    });
    return { ok: false };
  }
  if (reserved.otpFailures > MAX_OTP_TRIES) {
    await lockNow();
    res.status(429).json({
      success: false,
      message: `Bahut zyada galat OTP. ${LOCK_MINUTES} minute baad dobara try karo.`
    });
    return { ok: false };
  }

  if (verifyBookingOtp(booking._id, kind, code)) return { ok: true };

  const left = MAX_OTP_TRIES - reserved.otpFailures;
  if (left <= 0) await lockNow();
  res.status(400).json({
    success: false,
    message: left > 0
      ? `OTP galat hai! ${left} attempt bache hain.`
      : `OTP galat hai! Bahut zyada attempts, ${LOCK_MINUTES} minute ke liye lock.`
  });
  return { ok: false };
};

// Worker: "I'm on my way" (shown to the customer on the tracking page)
router.put('/on-the-way/:bookingId', async (req, res) => {
  try {
    const booking = await loadMyJob(req, res);
    if (!booking) return;
    if (booking.status !== 'Confirmed') {
      return res.status(400).json({ success: false, message: 'Yeh abhi on-the-way mark nahi ho sakti.' });
    }
    if (booking.onTheWayAt) {
      return res.status(400).json({ success: false, message: 'Aap pehle hi on the way mark kar chuke ho.' });
    }
    booking.onTheWayAt = new Date();
    await booking.save();
    res.json({ success: true, message: 'Customer ko bata diya gaya! 🚗', booking });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error!',
      error: (process.env.NODE_ENV === 'development' ? error.message : undefined)
    });
  }
});

// Worker: enter the customer's START code to begin the job
router.post('/start/:bookingId', async (req, res) => {
  try {
    const booking = await loadMyJob(req, res);
    if (!booking) return;
    if (booking.status !== 'Confirmed') {
      return res.status(400).json({ success: false, message: 'Yeh booking abhi start nahi ho sakti.' });
    }

    const check = await checkBookingCode(res, booking, 'start', req.body.otp);
    if (!check.ok) return;

    const started = await Booking.findOneAndUpdate(
      { _id: booking._id, status: 'Confirmed' },
      { status: 'In Progress', startedAt: new Date(), otpFailures: 0, otpLockedUntil: null },
      { returnDocument: 'after' }
    );
    if (!started) {
      return res.status(400).json({ success: false, message: 'Yeh booking pehle hi start ho chuki hai.' });
    }
    res.json({ success: true, message: 'Kaam shuru! Best of luck 💪', booking: started });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error!',
      error: (process.env.NODE_ENV === 'development' ? error.message : undefined)
    });
  }
});

// Worker: enter the customer's END code to finish the job
router.post('/end/:bookingId', async (req, res) => {
  try {
    const booking = await loadMyJob(req, res);
    if (!booking) return;
    if (booking.status !== 'In Progress') {
      return res.status(400).json({ success: false, message: 'Pehle kaam start karo.' });
    }

    const check = await checkBookingCode(res, booking, 'end', req.body.otp);
    if (!check.ok) return;

    const done = await Booking.findOneAndUpdate(
      { _id: booking._id, status: 'In Progress' },
      { status: 'Completed', completedAt: new Date(), otpFailures: 0, otpLockedUntil: null },
      { returnDocument: 'after' }
    )
      .populate('customer', 'name phone email')
      .populate('assignedWorker', 'name phone');
    if (!done) {
      return res.status(400).json({ success: false, message: 'Yeh booking pehle hi complete ho chuki hai.' });
    }

    await User.findByIdAndUpdate(req.user.id, { isAvailable: true });

    if (done.customer?.email) {
      sendBookingCompletedEmail({
        customerName: done.customer.name,
        customerEmail: done.customer.email,
        workerName: done.assignedWorker?.name || 'Worker',
        service: done.service,
        date: done.date,
        price: done.price,
        bookingId: done._id
      }).catch(err => console.log('Complete email error:', err.message));
    }

    res.json({ success: true, message: 'Kaam complete ho gaya! 🌟', booking: done });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error!',
      error: (process.env.NODE_ENV === 'development' ? error.message : undefined)
    });
  }
});

module.exports = router;