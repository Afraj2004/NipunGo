const test = require('node:test');
const assert = require('node:assert');
const crypto = require('crypto');
process.env.RAZORPAY_SECRET = 'test-razorpay-secret';
const { signatureFor } = require('../routes/payment');

test('the signature matches Razorpay\'s documented scheme: HMAC-SHA256 of "order|payment"', () => {
  const expected = crypto.createHmac('sha256', 'test-razorpay-secret').update('order_123|pay_456').digest('hex');
  assert.strictEqual(signatureFor('order_123', 'pay_456'), expected);
});

test('changing the order or payment id changes the signature', () => {
  assert.notStrictEqual(signatureFor('order_123', 'pay_456'), signatureFor('order_124', 'pay_456'));
  assert.notStrictEqual(signatureFor('order_123', 'pay_456'), signatureFor('order_123', 'pay_457'));
});
