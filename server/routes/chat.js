const express = require('express');
const router = express.Router();
const { sendChatMessage } = require('../config/gemini');
const { protect } = require('../middleware/auth');
const { SERVICE_PRICES, getBookingTotal } = require('../config/services');
const rateLimit = require('express-rate-limit');
const ChatCache = require('../models/ChatCache');
const { normalizeQuery, cacheKey, isCacheable } = require('../utils/chatText');

// AI calls cost money: cap each user (not each IP) to a sensible rate
const aiLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 20,
  keyGenerator: (req) => String(req.user?.id || 'anonymous'),
  standardHeaders: true,
  legacyHeaders: false,
  validate: { keyGeneratorIpFallback: false },
  message: {
    success: false,
    message: 'Bahut zyada sawal! Thodi der baad dobara try karo.',
  },
});

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

const MAX_MESSAGE_CHARS = 1000;
const MAX_HISTORY_TURNS = 20;
const MAX_TURN_CHARS = 2000;

// Never trust client-sent history: keep only well-formed user/model text turns
const sanitizeHistory = (history) => {
  if (!Array.isArray(history)) return [];
  const clean = [];
  for (const turn of history.slice(-MAX_HISTORY_TURNS)) {
    const text = turn?.parts?.[0]?.text;
    if ((turn?.role !== 'user' && turn?.role !== 'model') || typeof text !== 'string' || !text.trim()) {
      continue;
    }
    const last = clean[clean.length - 1];
    if (last && last.role === turn.role) continue; // keep strict alternation
    clean.push({ role: turn.role, parts: [{ text: text.slice(0, MAX_TURN_CHARS) }] });
  }
  while (clean.length && clean[0].role !== 'user') clean.shift();
  if (clean.length && clean[clean.length - 1].role === 'user') clean.pop();
  return clean;
};

router.post('/message', protect, aiLimiter, async (req, res) => {
  const { message, history } = req.body; // history: [{role: "user"|"model", parts: [{text}]}]

  if (typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ success: false, message: 'Message required hai!' });
  }
  if (message.length > MAX_MESSAGE_CHARS) {
    return res.status(400).json({ success: false, message: 'Message bahut lamba hai!' });
  }

  try {
    const cleanHistory = sanitizeHistory(history);

    // A standalone first question that was answered before costs nothing
    const normalized = normalizeQuery(message);
    const cacheable = cleanHistory.length === 0 && isCacheable(normalized);
    const key = cacheable ? cacheKey(normalized) : null;

    if (cacheable) {
      try {
        const hit = await ChatCache.findOneAndUpdate({ key }, { $inc: { hits: 1 } });
        if (hit) {
          return res.json({
            success: true,
            reply: hit.reply,
            suggestion: hit.suggestion,
            intent: hit.suggestion ? 'book' : 'chat',
            cached: true,
          });
        }
      } catch (cacheErr) {
        console.error('Chat cache read failed:', cacheErr.message);
      }
    }

    const reply = await sendChatMessage(message, cleanHistory);
    const suggestion = extractSuggestion(reply);

    if (cacheable) {
      ChatCache.updateOne(
        { key },
        { $setOnInsert: { key, query: normalized, reply, suggestion, hits: 0 } },
        { upsert: true }
      ).catch((e) => console.error('Chat cache write failed:', e.message));
    }

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
