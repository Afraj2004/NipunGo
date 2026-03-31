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

// ════════════════════════════════════════════════
// 📌 1. BOOKING BANAO
// ════════════════════════════════════════════════
router.post('/create', async (req, res) => {
  try {
    const {
      customerId, service, date,
      time, address, description, price
    } = req.body;

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
      const booking = await Booking.create({
        customer: customerId,
        service, date, time, address,
        description: description || '',
        price, status: 'No Workers',
        pendingWorkers: []
      });

      return res.status(200).json({
        success: false,
        message: 'Abhi koi worker available nahi hai!',
        booking
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
      error: error.message
    });
  }
});

// ════════════════════════════════════════════════
// 📌 2. WORKER REQUESTS
// ════════════════════════════════════════════════
router.get('/worker-requests/:workerId', async (req, res) => {
  try {
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
      error: error.message
    });
  }
});

// ════════════════════════════════════════════════
// 📌 3. BOOKING ACCEPT
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
      error: error.message
    });
  }
});

// ════════════════════════════════════════════════
// 📌 4. BOOKING REJECT
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
      error: error.message
    });
  }
});

// ════════════════════════════════════════════════
// 📌 5. MY BOOKINGS
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

    res.json({ success: true, bookings });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error!',
      error: error.message
    });
  }
});

// ════════════════════════════════════════════════
// 📌 6. WORKER BOOKINGS
// ════════════════════════════════════════════════
router.get('/worker-bookings/:workerId', async (req, res) => {
  try {
    const bookings = await Booking.find({
      assignedWorker: req.params.workerId,
      status: { $in: ['Confirmed', 'Completed', 'Cancelled'] }
    })
      .populate('customer', 'name email phone')
      .sort({ createdAt: -1 });

    res.json({ success: true, bookings });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error!',
      error: error.message
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
        'name service phone city rating price experience about'
      );

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking nahi mili!'
      });
    }

    res.json({ success: true, booking });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error!',
      error: error.message
    });
  }
});

// ════════════════════════════════════════════════
// 📌 8. BOOKING COMPLETE
// ════════════════════════════════════════════════
router.put('/complete/:bookingId', async (req, res) => {
  try {
    const booking = await Booking.findByIdAndUpdate(
      req.params.bookingId,
      { status: 'Completed' },
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
      error: error.message
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

    if (booking.status === 'Completed') {
      return res.status(400).json({
        success: false,
        message: 'Completed booking cancel nahi ho sakti!'
      });
    }

    const updatedBooking = await Booking.findByIdAndUpdate(
      req.params.bookingId,
      { status: 'Cancelled', pendingWorkers: [] },
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
      error: error.message
    });
  }
});

// ════════════════════════════════════════════════
// 📌 10. ALL BOOKINGS (ADMIN)
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