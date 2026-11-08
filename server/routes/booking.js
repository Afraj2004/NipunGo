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
} = require('../utils/emailService');
const { protect, adminOnly } = require('../middleware/auth');
const { getBookingTotal, validateSchedule } = require('../config/services');
const { deriveOtp, verifyBookingOtp } = require('../utils/bookingOtp');
const { present, shortName } = require('../utils/bookingView');
const rateLimit = require('express-rate-limit');

// Every booking route needs a login
router.use(protect);

const isAdmin = (req) => req.user.role === 'admin';
const sameId = (a, b) => String(a?._id || a) === String(b?._id || b);
const forbid = (res) => res.status(403).json({
  success: false,
  message: 'Aapko is action ki permission nahi hai!'
});
const serverError = (res, error) => res.status(500).json({
  success: false,
  message: 'Server Error!',
  error: (process.env.NODE_ENV === 'development' ? error.message : undefined)
});

// A worker's public-facing details (never phone / email; see utils/bookingView.js)
const WORKER_FIELDS = 'name service city rating price experience about photoUrl';

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
    const { service, date, time, address } = req.body;
    const description = typeof req.body.description === 'string' ? req.body.description.trim() : '';
    const paymentMethod = req.body.paymentMethod === 'online' ? 'online' : 'cash';

    if (!service || !date || !time || typeof address !== 'string' || !address.trim()) {
      return res.status(400).json({ success: false, message: 'Saari details bharo!' });
    }
    if (address.trim().length < 10 || address.length > 250) {
      return res.status(400).json({ success: false, message: 'Poora address likho (10-250 characters)!' });
    }
    if (description.length > 300) {
      return res.status(400).json({ success: false, message: 'Note 300 characters se chhota rakho!' });
    }

    // Price server decides: the client is never trusted for money
    const price = getBookingTotal(service);
    if (price === null) {
      return res.status(400).json({ success: false, message: 'Yeh service available nahi hai!' });
    }

    // Past dates / times are refused here too, not just in the form
    const schedule = validateSchedule(date, time);
    if (!schedule.ok) {
      return res.status(400).json({ success: false, message: schedule.message });
    }

    const availableWorkers = await User.find({
      role: 'worker',
      service,
      isAvailable: true
    }).select('_id name');

    if (availableWorkers.length === 0) {
      // No record: the customer's history stays clean
      return res.status(200).json({
        success: false,
        noWorkers: true,
        message: `Abhi ${service} ka koi worker available nahi hai. ` +
          'Thodi der baad try karo ya koi aur service dekho.'
      });
    }

    const booking = await Booking.create({
      customer: customerId,
      service, date, time,
      address: address.trim(),
      description,
      price,
      paymentMethod,
      status: 'Searching',
      pendingWorkers: availableWorkers.map(w => w._id),
      assignedWorker: null
    });

    const customer = await User.findById(customerId).select('name email');
    if (customer?.email) {
      sendBookingCreatedEmail({
        customerName: customer.name,
        customerEmail: customer.email,
        service, date, time, address: booking.address, price,
        bookingId: booking._id,
        workersNotified: availableWorkers.length
      }).catch(err => console.log('Booking email error:', err.message));
    }

    res.status(201).json({
      success: true,
      message: `Booking request ${availableWorkers.length} workers ko bheji gayi! ✅`,
      booking: present(booking, req.user),
      workersNotified: availableWorkers.length
    });
  } catch (error) {
    console.error('Booking create error:', error);
    serverError(res, error);
  }
});

// ════════════════════════════════════════════════
// 📌 2. WORKER REQUESTS (only the area is shown until the worker accepts)
// ════════════════════════════════════════════════
router.get('/worker-requests/:workerId', async (req, res) => {
  try {
    if (!sameId(req.params.workerId, req.user.id) && !isAdmin(req)) return forbid(res);
    const requests = await Booking.find({
      pendingWorkers: req.params.workerId,
      status: 'Searching'
    })
      .populate('customer', 'name')
      .sort({ createdAt: -1 });

    const shown = requests.map(r => present(r, req.user));
    res.json({ success: true, requests: shown, count: shown.length });
  } catch (error) {
    serverError(res, error);
  }
});

// ════════════════════════════════════════════════
// 📌 3. BOOKING ACCEPT (atomic: only one worker can win)
// ════════════════════════════════════════════════
router.put('/accept/:bookingId', async (req, res) => {
  try {
    if (req.user.role !== 'worker') return forbid(res);
    const { bookingId } = req.params;
    const workerId = req.user.id;

    // One database operation checks "still open" and "was offered to me" and assigns me,
    // so two workers pressing Accept together can never both succeed.
    const booking = await Booking.findOneAndUpdate(
      { _id: bookingId, status: 'Searching', pendingWorkers: workerId },
      {
        status: 'Confirmed',
        assignedWorker: workerId,
        pendingWorkers: [],
        acceptedAt: new Date()
      },
      { returnDocument: 'after' }
    );

    if (!booking) {
      const existing = await Booking.findById(bookingId);
      if (!existing) {
        return res.status(404).json({ success: false, message: 'Booking nahi mili!' });
      }
      if (existing.status !== 'Searching') {
        return res.status(400).json({ success: false, message: 'Yeh booking already accept ho chuki hai!' });
      }
      return res.status(403).json({ success: false, message: 'Aap is booking ke liye authorized nahi hain!' });
    }

    // Emails need the real addresses; the response below never carries them
    await booking.populate([
      { path: 'customer', select: 'name email' },
      { path: 'assignedWorker', select: `${WORKER_FIELDS} email` }
    ]);
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
        workerCity: assignedWorker.city,
        workerRating: assignedWorker.rating,
        workerExperience: assignedWorker.experience
      }).catch(err => console.log('Worker assigned email error:', err.message));
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
        customerName: shortName(customer?.name)
      }).catch(err => console.log('New job email error:', err.message));
    }

    res.json({
      success: true,
      message: 'Booking Accept Ho Gayi! 🎉',
      booking: present(booking, req.user)
    });
  } catch (error) {
    serverError(res, error);
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

    // Only a worker who was offered a still-open booking can decline it
    const booking = await Booking.findOneAndUpdate(
      { _id: bookingId, status: 'Searching', pendingWorkers: workerId },
      { $pull: { pendingWorkers: workerId }, $push: { rejectedWorkers: workerId } },
      { returnDocument: 'after' }
    );

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Yeh request ab available nahi hai.' });
    }

    if (booking.pendingWorkers.length === 0) {
      await Booking.updateOne({ _id: bookingId, status: 'Searching' }, { status: 'No Workers' });
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
    serverError(res, error);
  }
});

// ════════════════════════════════════════════════
// 📌 5. MY BOOKINGS
// ════════════════════════════════════════════════
router.get('/my-bookings/:customerId', async (req, res) => {
  try {
    if (!sameId(req.params.customerId, req.user.id) && !isAdmin(req)) return forbid(res);
    const bookings = await Booking.find({ customer: req.params.customerId })
      .populate('assignedWorker', WORKER_FIELDS)
      .sort({ createdAt: -1 });

    res.json({ success: true, bookings: bookings.map(b => present(b, req.user)) });
  } catch (error) {
    serverError(res, error);
  }
});

// ════════════════════════════════════════════════
// 📌 6. WORKER BOOKINGS
// ════════════════════════════════════════════════
router.get('/worker-bookings/:workerId', async (req, res) => {
  try {
    if (!sameId(req.params.workerId, req.user.id) && !isAdmin(req)) return forbid(res);
    const bookings = await Booking.find({
      assignedWorker: req.params.workerId,
      status: { $in: ['Confirmed', 'In Progress', 'Completed', 'Cancelled'] }
    })
      .populate('customer', 'name')
      .sort({ createdAt: -1 });

    res.json({ success: true, bookings: bookings.map(b => present(b, req.user)) });
  } catch (error) {
    serverError(res, error);
  }
});

// ════════════════════════════════════════════════
// 📌 7. SINGLE BOOKING (the customer, and only the customer, also gets the current OTP)
// ════════════════════════════════════════════════
router.get('/single/:bookingId', async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.bookingId)
      .populate('customer', 'name')
      .populate('assignedWorker', WORKER_FIELDS);

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking nahi mili!' });
    }

    const involved =
      sameId(booking.customer, req.user.id) ||
      sameId(booking.assignedWorker, req.user.id) ||
      (booking.pendingWorkers || []).some(w => sameId(w, req.user.id));
    if (!involved && !isAdmin(req)) return forbid(res);

    const data = present(booking, req.user);
    if (sameId(booking.customer, req.user.id)) {
      data.otps = {};
      if (booking.status === 'Confirmed') data.otps.start = deriveOtp(booking._id, 'start');
      if (booking.status === 'In Progress') data.otps.end = deriveOtp(booking._id, 'end');
    }

    res.json({ success: true, booking: data });
  } catch (error) {
    serverError(res, error);
  }
});

// ════════════════════════════════════════════════
// 📌 7b. CALL THE OTHER PERSON ("Call karo")
//    Phone numbers are never in any list, page or email. This is the only place one is
//    returned, and only when the caller presses "Call karo":
//      - only the customer and the assigned worker of that booking
//      - only while the job is active (Confirmed / In Progress), or finished but unpaid
//      - rate limited per user, and every request is logged on the booking
// ════════════════════════════════════════════════
const callLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 30,
  keyGenerator: (req) => String(req.user?.id || 'anonymous'),
  validate: { keyGeneratorIpFallback: false },
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Bahut zyada call requests. Thodi der baad try karo.' }
});

router.get('/call/:bookingId', callLimiter, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.bookingId)
      .populate('customer', 'name phone')
      .populate('assignedWorker', 'name phone');
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking nahi mili!' });
    }

    const isCustomer = sameId(booking.customer, req.user.id);
    const isWorker = sameId(booking.assignedWorker, req.user.id);
    if (!isCustomer && !isWorker) return forbid(res);

    const active = ['Confirmed', 'In Progress'].includes(booking.status);
    const dueAfterWork = booking.status === 'Completed' && booking.paymentStatus !== 'paid';
    if (!active && !dueAfterWork) {
      return res.status(400).json({
        success: false,
        message: 'Call sirf tab ho sakta hai jab booking chal rahi ho ya payment baaki ho.'
      });
    }

    const other = isCustomer ? booking.assignedWorker : booking.customer;
    if (!other?.phone) {
      return res.status(404).json({ success: false, message: 'Number available nahi hai.' });
    }

    // Keep a short audit trail on the booking (last 20 requests)
    await Booking.updateOne(
      { _id: booking._id },
      { $push: { contactLog: { $each: [{ by: req.user.id, at: new Date() }], $slice: -20 } } }
    );

    res.json({
      success: true,
      name: isCustomer ? other.name : shortName(other.name),
      phone: other.phone
    });
  } catch (error) {
    serverError(res, error);
  }
});

// ════════════════════════════════════════════════
// 📌 8. COMPLETE WITHOUT A CODE (support action: admin only)
// ════════════════════════════════════════════════
router.put('/complete/:bookingId', adminOnly, async (req, res) => {
  try {
    const existing = await Booking.findById(req.params.bookingId);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Booking nahi mili!' });
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
      { returnDocument: 'after' }
    )
      .populate('customer', 'name phone email')
      .populate('assignedWorker', 'name phone');

    if (booking.assignedWorker) {
      await User.findByIdAndUpdate(booking.assignedWorker._id, { isAvailable: true });
    }
    if (booking.customer?.email) {
      sendBookingCompletedEmail({
        customerName: booking.customer.name,
        customerEmail: booking.customer.email,
        workerName: booking.assignedWorker?.name || 'Worker',
        service: booking.service,
        date: booking.date,
        price: booking.price,
        bookingId: booking._id
      }).catch(err => console.log('Complete email error:', err.message));
    }

    res.json({ success: true, message: 'Kaam complete ho gaya! 🌟', booking });
  } catch (error) {
    serverError(res, error);
  }
});

// ════════════════════════════════════════════════
// 📌 9. CANCEL
// ════════════════════════════════════════════════
router.put('/cancel/:bookingId', async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.bookingId).populate('customer', 'name email');
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking nahi mili!' });
    }
    if (
      !sameId(booking.customer, req.user.id) &&
      !sameId(booking.assignedWorker, req.user.id) &&
      !isAdmin(req)
    ) return forbid(res);

    if (booking.status === 'Completed') {
      return res.status(400).json({ success: false, message: 'Completed booking cancel nahi ho sakti!' });
    }
    if (booking.status === 'Cancelled') {
      return res.status(400).json({ success: false, message: 'Yeh booking pehle hi cancel ho chuki hai!' });
    }
    if (booking.status === 'In Progress' && !isAdmin(req)) {
      return res.status(400).json({
        success: false,
        message: 'Kaam shuru ho chuka hai. Cancel karne ke liye support se baat karo.'
      });
    }
    // Money has been taken: a refund needs a human
    if (booking.paymentStatus === 'paid' && !isAdmin(req)) {
      return res.status(400).json({
        success: false,
        message: 'Payment ho chuki hai. Cancel / refund ke liye support se baat karo.'
      });
    }

    const updated = await Booking.findByIdAndUpdate(
      req.params.bookingId,
      { status: 'Cancelled', pendingWorkers: [], cancelledAt: new Date() },
      { returnDocument: 'after' }
    );

    if (booking.customer?.email) {
      sendBookingCancelledEmail({
        customerName: booking.customer.name,
        customerEmail: booking.customer.email,
        service: booking.service,
        date: booking.date,
        price: booking.price
      }).catch(err => console.log('Cancel email error:', err.message));
    }

    res.json({
      success: true,
      message: 'Booking cancel ho gayi!',
      booking: present(updated, req.user)
    });
  } catch (error) {
    serverError(res, error);
  }
});

// ════════════════════════════════════════════════
// 📌 10. ALL BOOKINGS (admin)
// ════════════════════════════════════════════════
router.get('/all', adminOnly, async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate('customer', 'name email phone')
      .populate('assignedWorker', 'name service phone')
      .sort({ createdAt: -1 });

    res.json({ success: true, bookings, total: bookings.length });
  } catch (error) {
    serverError(res, error);
  }
});

// ════════════════════════════════════════════════
// 📌 SERVICE TRACKING: on the way -> start OTP -> end OTP -> payment
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
    res.json({ success: true, message: 'Customer ko bata diya gaya! 🚗', booking: present(booking, req.user) });
  } catch (error) {
    serverError(res, error);
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
    res.json({ success: true, message: 'Kaam shuru! Best of luck 💪', booking: present(started, req.user) });
  } catch (error) {
    serverError(res, error);
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
      .populate('customer', 'name email')
      .populate('assignedWorker', 'name');
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

    res.json({ success: true, message: 'Kaam complete ho gaya! 🌟', booking: present(done, req.user) });
  } catch (error) {
    serverError(res, error);
  }
});

// Worker: "I collected the cash" after a completed job (the customer can't mark this themselves)
router.put('/cash-received/:bookingId', async (req, res) => {
  try {
    const booking = await loadMyJob(req, res);
    if (!booking) return;
    if (booking.status !== 'Completed') {
      return res.status(400).json({ success: false, message: 'Pehle kaam complete karo.' });
    }

    const paid = await Booking.findOneAndUpdate(
      // "not paid yet", not "== pending": bookings made before payments existed have no paymentStatus at all
      { _id: booking._id, status: 'Completed', paymentStatus: { $ne: 'paid' } },
      { paymentStatus: 'paid', paidVia: 'cash', paidAt: new Date(), paidAmount: booking.price },
      { returnDocument: 'after' }
    );
    if (!paid) {
      return res.status(400).json({ success: false, message: 'Is booking ka payment pehle hi ho chuka hai.' });
    }
    res.json({ success: true, message: `₹${paid.price} cash mil gaya. Payment record ho gaya ✅`, booking: present(paid, req.user) });
  } catch (error) {
    serverError(res, error);
  }
});

module.exports = router;
