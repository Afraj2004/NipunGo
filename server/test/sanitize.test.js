const test = require('node:test');
const assert = require('node:assert');
const { hasBadKey, sanitizeRequest } = require('../middleware/sanitize');

test('detects MongoDB operators and dotted keys at any depth', () => {
  assert.strictEqual(hasBadKey({ email: { $ne: null } }), true);
  assert.strictEqual(hasBadKey({ a: { b: [{ $gt: '' }] } }), true);
  assert.strictEqual(hasBadKey({ 'profile.role': 'admin' }), true);
});

test('lets normal data through', () => {
  assert.strictEqual(hasBadKey({ email: 'a@b.com', address: '12 MG Road, Pune' }), false);
  assert.strictEqual(hasBadKey(undefined), false);
  assert.strictEqual(hasBadKey('text'), false);
});

test('middleware answers 400 for bad requests and calls next otherwise', () => {
  let status = null, nextCalled = false;
  const res = { status(s) { status = s; return this; }, json() {} };
  sanitizeRequest({ body: { password: { $ne: 1 } }, query: {}, params: {} }, res, () => { nextCalled = true; });
  assert.strictEqual(status, 400);
  assert.strictEqual(nextCalled, false);

  sanitizeRequest({ body: { a: 1 }, query: {}, params: {} }, res, () => { nextCalled = true; });
  assert.strictEqual(nextCalled, true);
});
