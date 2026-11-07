// Reject request bodies/queries that try to smuggle MongoDB operators
// ({"email": {"$ne": null}}) or dotted paths into a query.
const hasBadKey = (value, depth = 0) => {
  if (!value || typeof value !== 'object' || depth > 6) return false;
  return Object.keys(value).some(
    (k) => k.startsWith('$') || k.includes('.') || hasBadKey(value[k], depth + 1)
  );
};

const sanitizeRequest = (req, res, next) => {
  if (hasBadKey(req.body) || hasBadKey(req.query) || hasBadKey(req.params)) {
    return res.status(400).json({ success: false, message: 'Invalid request!' });
  }
  next();
};

module.exports = { sanitizeRequest, hasBadKey };
