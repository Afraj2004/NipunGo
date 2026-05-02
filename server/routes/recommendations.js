const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const { protect } = require('../middleware/auth');

router.get('/suggested', protect, async (req, res) => {
  try {
    // 1. Fetch user's completed bookings to understand patterns
    const history = await Booking.find({ 
      customer: req.user.id, 
      status: 'Completed' 
    }).sort({ createdAt: -1 });

    let suggestions = [];
    const pastServices = history.map(b => b.service);

    // 2. Logic: Frequency Based (The "Quick" in Q-Commerce)
    // If they haven't booked anything, suggest top trending services
    if (history.length === 0) {
      suggestions = ['Electrician', 'Plumber', 'AC Mechanic'];
    } else {
      // 3. Logic: Cross-Service Intelligence
      if (pastServices.includes('AC Mechanic')) suggestions.push('Cleaner'); // AC dusts up the room
      if (pastServices.includes('Plumber')) suggestions.push('Pest Control'); // Damp areas attract pests

      // Add more logic based on business goals
      const uniquePast = [...new Set(pastServices)];
      suggestions = [...new Set([...suggestions, ...uniquePast])].slice(0, 4);
    }

    res.json({ success: true, recommendations: suggestions });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching suggestions" });
  }
});

module.exports = router;