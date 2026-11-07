const mongoose = require('mongoose');

// Answers the AI already gave to a standalone first question, so the same
// question never costs another AI call (and answers instantly).
const chatCacheSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true }, // hash of the normalised question
  query: { type: String, required: true },             // normalised question (for debugging)
  reply: { type: String, required: true },
  suggestion: { type: Object, default: null },         // { service, price } or null
  hits: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now, expires: 60 * 60 * 24 * 30 }, // auto-delete after 30 days
});

module.exports = mongoose.model('ChatCache', chatCacheSchema);
