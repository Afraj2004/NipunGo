const express = require('express');
const router = express.Router();
const geminiModel = require('../config/gemini');
const { protect } = require('../middleware/auth');

router.post('/message', protect, async (req, res) => {
  const { message, history } = req.body; // history: [{role: "user", parts: [{text: "..."}]}, ...]

  try {
    const chat = geminiModel.startChat({ history });
    const result = await chat.sendMessage(message);
    const responseText = result.response.text();

    // Check if Gemini suggested a booking in the response
    const hasBookingIntent = responseText.includes("BOOKING_SUGGESTION");
    
    res.json({ 
      success: true, 
      reply: responseText,
      intent: hasBookingIntent ? "book" : "chat" 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "AI Error" });
  }
});

module.exports = router;