const test = require('node:test');
const assert = require('node:assert');
const { present, shortName, maskAddress } = require('../utils/bookingView');

const CUSTOMER = { _id: 'c1', id: 'c1', role: 'customer' };
const WORKER = { _id: 'w1', id: 'w1', role: 'worker' };
const ADMIN = { _id: 'a1', id: 'a1', role: 'admin' };

const booking = (extra = {}) => ({
  _id: 'b1',
  status: 'Confirmed',
  address: '12 MG Road, Flat 4B, Pune - 411001',
  customer: { _id: 'c1', name: 'Asha Rao', phone: '9876543210', email: 'asha@example.com' },
  assignedWorker: { _id: 'w1', name: 'Ravi Kumar', phone: '9123456780', email: 'ravi@example.com', rating: 4.5 },
  pendingWorkers: ['w1', 'w2'],
  rejectedWorkers: ['w3'],
  otpFailures: 3,
  otpLockedUntil: null,
  razorpayOrderId: 'order_x',
  razorpayPaymentId: 'pay_x',
  ...extra,
});

test('shortName keeps the first name and last initial', () => {
  assert.strictEqual(shortName('Asha Rao'), 'Asha R.');
  assert.strictEqual(shortName('  asha  kumari  rao '), 'asha R.');
  assert.strictEqual(shortName('Asha'), 'Asha');
  assert.strictEqual(shortName(''), 'Customer');
});

test('maskAddress shows only the area', () => {
  const masked = maskAddress('12 MG Road, Flat 4B, Pune - 411001');
  assert.ok(masked.includes('Pune - 411001'));
  assert.ok(!masked.includes('MG Road') && !masked.includes('Flat'));
  assert.ok(!maskAddress('just one chunk').includes('just one chunk'));
});

test('the worker never gets the customer phone/email, and sees a short name', () => {
  const out = present(booking(), WORKER);
  assert.deepStrictEqual(out.customer, { _id: 'c1', name: 'Asha R.' });
  assert.ok(!JSON.stringify(out).includes('9876543210'));
  assert.ok(!JSON.stringify(out).includes('asha@example.com'));
});

test('the customer never gets the worker phone/email', () => {
  const out = present(booking(), CUSTOMER);
  assert.strictEqual(out.assignedWorker.name, 'Ravi Kumar');
  assert.strictEqual(out.assignedWorker.rating, 4.5);
  assert.ok(!JSON.stringify(out).includes('9123456780'));
  assert.ok(!JSON.stringify(out).includes('ravi@example.com'));
  assert.strictEqual(out.customer.name, 'Asha Rao'); // their own name in full
});

test('internal fields never leave the server (customer or worker)', () => {
  for (const viewer of [CUSTOMER, WORKER]) {
    const out = present(booking(), viewer);
    for (const k of ['pendingWorkers', 'rejectedWorkers', 'otpFailures', 'otpLockedUntil', 'razorpayOrderId', 'razorpayPaymentId']) {
      assert.ok(!(k in out), `${k} leaked to ${viewer.role}`);
    }
  }
});

test('the customer learns how many workers were notified, not who', () => {
  assert.strictEqual(present(booking(), CUSTOMER).workersNotified, 2);
  assert.ok(!('workersNotified' in present(booking(), WORKER)));
});

test('a worker sees only the area while the request is still open, the full address after accepting', () => {
  const open = present(booking({ status: 'Searching', assignedWorker: null }), WORKER);
  assert.ok(!open.address.includes('MG Road'));
  const accepted = present(booking({ status: 'Confirmed' }), WORKER);
  assert.ok(accepted.address.includes('MG Road'));
});

test('the customer always sees their full address', () => {
  assert.ok(present(booking({ status: 'Searching' }), CUSTOMER).address.includes('MG Road'));
});

test('admins see everything', () => {
  const out = present(booking(), ADMIN);
  assert.strictEqual(out.customer.phone, '9876543210');
  assert.strictEqual(out.razorpayOrderId, 'order_x');
});

test('unpopulated references (plain ids) pass through untouched', () => {
  const out = present({ _id: 'b1', status: 'Confirmed', customer: 'c1', assignedWorker: 'w1', address: 'x, y' }, WORKER);
  assert.strictEqual(out.customer, 'c1');
  assert.strictEqual(out.assignedWorker, 'w1');
});
