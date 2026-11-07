const express = require('express');
const router = express.Router();
const { sendChatMessage } = require('../config/gemini');
const { protect } = require('../middleware/auth');

router.post('/message', protect, async (req, res) => {
  const { message, history } = req.body; // history: [{role: "user"|"model", parts: [{text}]}]

  if (typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ success: false, message: 'Message required hai!' });
  }

  try {
    const reply = await sendChatMessage(message, Array.isArray(history) ? history : []);
    const hasBookingIntent = reply.includes('BOOKING_SUGGESTION');

    res.json({
      success: true,
      reply,
      intent: hasBookingIntent ? 'book' : 'chat',
    });
  } catch (error) {
    console.error('Gemini error:', error.message);
    res.status(500).json({ success: false, message: 'AI Error' });
  }
});

module.exports = router;
