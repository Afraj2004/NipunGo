const express = require('express');
const router = express.Router();
const { sendChatMessage } = require('../config/gemini');
const { protect } = require('../middleware/auth');
const { SERVICE_PRICES, getBookingTotal } = require('../config/services');

// Pull the BOOKING_SUGGESTION JSON out of the reply and validate it,
// so the client only ever gets a real service with the real price.
const extractSuggestion = (reply) => {
  const match = reply.match(/\{[^{}]*"BOOKING_SUGGESTION"[^{}]*\}/);
  if (!match) return null;
  try {
    const { service } = JSON.parse(match[0]);
    if (!Object.prototype.hasOwnProperty.call(SERVICE_PRICES, service)) return null;
    return { service, price: getBookingTotal(service) };
  } catch {
    return null;
  }
};

router.post('/message', protect, async (req, res) => {
  const { message, history } = req.body; // history: [{role: "user"|"model", parts: [{text}]}]

  if (typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ success: false, message: 'Message required hai!' });
  }

  try {
    const reply = await sendChatMessage(message, Array.isArray(history) ? history : []);
    const suggestion = extractSuggestion(reply);

    res.json({
      success: true,
      reply,
      suggestion,
      intent: suggestion ? 'book' : 'chat',
    });
  } catch (error) {
    console.error('Gemini error:', error.message);
    const notConfigured = /GEMINI_API_KEY/.test(error.message);
    res.status(notConfigured ? 503 : 500).json({
      success: false,
      message: notConfigured ? 'AI is not configured on the server' : 'AI Error',
    });
  }
});

module.exports = router;
