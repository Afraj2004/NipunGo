const crypto = require('crypto');

// Random numeric code, e.g. generateOtp(6) -> "048213". Uses crypto.randomInt (not Math.random).
const generateOtp = (digits = 6) =>
  String(crypto.randomInt(0, 10 ** digits)).padStart(digits, '0');

// Codes are stored as an HMAC (keyed with the server secret), never in plain text.
// A leaked database therefore can't be used to read or cheaply brute-force codes.
const hashOtp = (scope, code) =>
  crypto
    .createHmac('sha256', process.env.JWT_SECRET || 'dev-only-secret')
    .update(`${scope}:${code}`)
    .digest('hex');

const verifyOtp = (scope, code, expectedHash) => {
  if (typeof code !== 'string' || !/^\d{4,8}$/.test(code) || !expectedHash) return false;
  const a = Buffer.from(hashOtp(scope, code), 'hex');
  const b = Buffer.from(expectedHash, 'hex');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
};

// Password rules for new passwords: 8+ chars with at least one letter and one number
const PASSWORD_RULE = /^(?=.*[A-Za-z])(?=.*\d).{8,72}$/;
const isStrongPassword = (pw) => typeof pw === 'string' && PASSWORD_RULE.test(pw);
const PASSWORD_MESSAGE =
  'Password kam se kam 8 characters ka ho, usme ek letter aur ek number zaroor ho!';

module.exports = {
  generateOtp,
  hashOtp,
  verifyOtp,
  isStrongPassword,
  PASSWORD_MESSAGE,
};
