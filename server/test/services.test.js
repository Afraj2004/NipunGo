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

const { validateSchedule, scheduledAt, TIME_SLOTS } = require('../config/services');

// 2027-01-05 09:30 India time
const NOW = new Date('2027-01-05T04:00:00Z');

test('a slot at least 30 minutes away is accepted', () => {
  assert.deepStrictEqual(validateSchedule('2027-01-05', '10:00 AM', NOW), { ok: true });
  assert.deepStrictEqual(validateSchedule('2027-01-06', '09:00 AM', NOW), { ok: true });
});

test('past times and earlier days are refused', () => {
  assert.strictEqual(validateSchedule('2027-01-05', '09:00 AM', NOW).ok, false);
  assert.strictEqual(validateSchedule('2027-01-04', '05:00 PM', NOW).ok, false);
  assert.strictEqual(validateSchedule('2020-01-01', '10:00 AM', NOW).ok, false);
});

test('unknown slots, junk dates and far-future dates are refused', () => {
  assert.strictEqual(validateSchedule('2027-01-06', '12:00 PM', NOW).ok, false); // not an offered slot
  assert.strictEqual(validateSchedule('2027-01-06', '3pm', NOW).ok, false);
  assert.strictEqual(validateSchedule('2027-02-31', '10:00 AM', NOW).ok, false);
  assert.strictEqual(validateSchedule('tomorrow', '10:00 AM', NOW).ok, false);
  assert.strictEqual(validateSchedule({ $ne: 1 }, '10:00 AM', NOW).ok, false);
  assert.strictEqual(validateSchedule('2027-04-05', '10:00 AM', NOW).ok, false); // > 60 days
});

test('scheduledAt reads the slot as India time', () => {
  assert.strictEqual(scheduledAt('2027-01-05', '02:00 PM').toISOString(), '2027-01-05T08:30:00.000Z');
  assert.strictEqual(scheduledAt('2027-01-05', '09:00 AM').toISOString(), '2027-01-05T03:30:00.000Z');
  assert.strictEqual(TIME_SLOTS.length, 7);
});
