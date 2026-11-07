const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { SERVICE_PRICES } = require('../config/services');

// "People who book X often need Y next"
const RELATED = {
  'AC Mechanic':     ['Cleaner', 'Electrician'],
  'Plumber':         ['Pest Control', 'Bathroom Fitter'],
  'Electrician':     ['AC Mechanic', 'IT Support'],
  'Carpenter':       ['Painter', 'Cleaner'],
  'Painter':         ['Cleaner', 'Carpenter'],
  'Cleaner':         ['Pest Control', 'Gardener'],
  'Bathroom Fitter': ['Plumber', 'Cleaner'],
  'Pest Control':    ['Cleaner'],
  'Gardener':        ['Cleaner', 'Pest Control'],
  'Locksmith':       ['Carpenter'],
  'IT Support':      ['Electrician'],
  'Laundry':         ['Cleaner'],
};
const DEFAULTS = ['Electrician', 'Plumber', 'AC Mechanic', 'Cleaner'];
const LIMIT = 4;

router.get('/suggested', protect, async (req, res) => {
  try {
    // Only suggest services that have at least one available worker right now
    const available = await User.distinct('service', {
      role: 'worker',
      isAvailable: true,
    });
    const hasWorkers = new Set(available.filter((s) => SERVICE_PRICES[s] !== undefined));

    const history = await Booking.find({
      customer: req.user.id,
      status: { $ne: 'Cancelled' },
    }).sort({ createdAt: -1 }).limit(30);

    // Most recent first; completed bookings count double
    const score = {};
    history.forEach((b, i) => {
      const recency = 1 / (1 + i * 0.1);
      score[b.service] = (score[b.service] || 0) + recency * (b.status === 'Completed' ? 2 : 1);
    });
    const pastServices = Object.keys(score).sort((a, b) => score[b] - score[a]);

    // Related services first, then repeat services, then defaults
    const candidates = [
      ...pastServices.flatMap((s) => RELATED[s] || []),
      ...pastServices,
      ...DEFAULTS,
    ];

    const suggestions = [...new Set(candidates)]
      .filter((s) => hasWorkers.has(s))
      .slice(0, LIMIT);

    // If nobody is available, still return something rather than an empty row
    res.json({
      success: true,
      recommendations: suggestions.length ? suggestions : DEFAULTS.slice(0, 3),
    });
  } catch (error) {
    console.error('Recommendations error:', error.message);
    res.status(500).json({ success: false, message: 'Error fetching suggestions' });
  }
});

module.exports = router;
