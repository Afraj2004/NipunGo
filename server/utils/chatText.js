const crypto = require('crypto');

// Lower-case, strip punctuation/emoji, collapse spaces: "Pipe LEAK ho raha hai!!"
// and "pipe leak ho raha hai" become the same cache key.
const normalizeQuery = (text) =>
  String(text || '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const cacheKey = (normalized) =>
  crypto.createHash('sha1').update(normalized).digest('hex');

// Only short, standalone questions are worth caching
const isCacheable = (normalized) =>
  normalized.length >= 3 && normalized.length <= 200;

module.exports = { normalizeQuery, cacheKey, isCacheable };
