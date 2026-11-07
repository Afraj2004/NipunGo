const test = require('node:test');
const assert = require('node:assert');
process.env.JWT_SECRET = 'test-secret';
const { generateOtp, hashOtp, verifyOtp, isStrongPassword } = require('../utils/otp');

test('generateOtp makes numeric codes of the requested length (keeping leading zeros)', () => {
  for (let i = 0; i < 200; i++) {
    assert.match(generateOtp(6), /^\d{6}$/);
    assert.match(generateOtp(4), /^\d{4}$/);
  }
});

test('a code verifies only against the scope and hash it was made for', () => {
  const hash = hashOtp('a@b.com:register', '123456');
  assert.strictEqual(verifyOtp('a@b.com:register', '123456', hash), true);
  assert.strictEqual(verifyOtp('a@b.com:register', '123457', hash), false);
  assert.strictEqual(verifyOtp('a@b.com:reset', '123456', hash), false); // different purpose
  assert.strictEqual(verifyOtp('x@b.com:register', '123456', hash), false); // different email
});

test('verifyOtp rejects malformed input instead of throwing', () => {
  const hash = hashOtp('s', '123456');
  assert.strictEqual(verifyOtp('s', undefined, hash), false);
  assert.strictEqual(verifyOtp('s', { $ne: null }, hash), false);
  assert.strictEqual(verifyOtp('s', '12', hash), false);
  assert.strictEqual(verifyOtp('s', '123456', undefined), false);
  assert.strictEqual(verifyOtp('s', '123456', 'not-hex'), false);
});

test('password policy: 8+ chars with a letter and a number', () => {
  assert.strictEqual(isStrongPassword('abc12345'), true);
  assert.strictEqual(isStrongPassword('short1'), false);
  assert.strictEqual(isStrongPassword('allletters'), false);
  assert.strictEqual(isStrongPassword('12345678'), false);
  assert.strictEqual(isStrongPassword(undefined), false);
  assert.strictEqual(isStrongPassword({ a: 1 }), false);
});
