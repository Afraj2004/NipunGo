const test = require('node:test');
const assert = require('node:assert');
const { getBookingTotal, SERVICE_PRICES } = require('../config/services');

test('getBookingTotal adds the platform fee', () => {
  assert.strictEqual(getBookingTotal('Plumber'), SERVICE_PRICES['Plumber'] + 50);
});

test('getBookingTotal rejects unknown services', () => {
  assert.strictEqual(getBookingTotal('Astrologer'), null);
  assert.strictEqual(getBookingTotal('__proto__'), null);
  assert.strictEqual(getBookingTotal(undefined), null);
});
