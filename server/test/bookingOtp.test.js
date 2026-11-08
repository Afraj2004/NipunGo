const test = require('node:test');
const assert = require('node:assert');
process.env.JWT_SECRET = 'test-secret';
const { deriveOtp, verifyBookingOtp } = require('../utils/bookingOtp');

const ID = '6aef73c28c6738fef1dfac8f';

test('codes are 4 digits and stable for a booking', () => {
  assert.match(deriveOtp(ID, 'start'), /^\d{4}$/);
  assert.strictEqual(deriveOtp(ID, 'start'), deriveOtp(ID, 'start'));
});

test('start and end codes differ, and so do different bookings', () => {
  const codes = new Set();
  for (let i = 0; i < 50; i++) {
    const id = ID.slice(0, -2) + String(10 + i);
    codes.add(deriveOtp(id, 'start'));
    codes.add(deriveOtp(id, 'end'));
  }
  assert.ok(codes.size > 60, `expected a spread of codes, got ${codes.size} distinct of 100`);
  // for a given booking the two codes should (almost always) be different
  let same = 0;
  for (let i = 0; i < 200; i++) {
    const id = ID.slice(0, -3) + String(100 + i);
    if (deriveOtp(id, 'start') === deriveOtp(id, 'end')) same++;
  }
  assert.ok(same < 5, `start==end too often (${same}/200)`);
});

test('verification accepts the right code only', () => {
  const code = deriveOtp(ID, 'start');
  assert.strictEqual(verifyBookingOtp(ID, 'start', code), true);
  assert.strictEqual(verifyBookingOtp(ID, 'end', code), deriveOtp(ID, 'end') === code); // wrong kind
  const wrong = String((Number(code) + 1) % 10000).padStart(4, '0');
  assert.strictEqual(verifyBookingOtp(ID, 'start', wrong), false);
});

test('malformed input is rejected, never thrown', () => {
  for (const bad of [undefined, null, 1234, '12', '12345', 'abcd', { $ne: 1 }, ['1234']]) {
    assert.strictEqual(verifyBookingOtp(ID, 'start', bad), false);
  }
});

test('a different secret gives different codes', () => {
  const a = deriveOtp(ID, 'start');
  process.env.JWT_SECRET = 'another-secret';
  const b = deriveOtp(ID, 'start');
  process.env.JWT_SECRET = 'test-secret';
  const ids = Array.from({ length: 30 }, (_, i) => ID.slice(0, -2) + String(10 + i));
  process.env.JWT_SECRET = 'another-secret';
  const other = ids.map((id) => deriveOtp(id, 'start'));
  process.env.JWT_SECRET = 'test-secret';
  const mine = ids.map((id) => deriveOtp(id, 'start'));
  assert.notDeepStrictEqual(mine, other);
  assert.ok(typeof a === 'string' && typeof b === 'string');
});
