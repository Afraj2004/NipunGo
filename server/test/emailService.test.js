const test = require('node:test');
const assert = require('node:assert');

// Capture what would be sent instead of sending it
const sent = [];
const mailerPath = require.resolve('../utils/mailer');
require.cache[mailerPath] = {
  id: mailerPath, filename: mailerPath, loaded: true,
  exports: { sendMail: async (m) => { sent.push(m); } },
};
process.env.CLIENT_URL = 'https://nipungo.example';
const email = require('../utils/emailService');

const EVIL = `<script>alert(1)</script><img src=x onerror=alert(2)> & "quotes"`;
const last = () => sent[sent.length - 1];
const assertSafe = (html) => {
  assert.ok(!html.includes('<script>alert'), 'raw <script> must not appear');
  assert.ok(!html.includes('<img src=x'), 'raw <img> must not appear');
  assert.ok(html.includes('&lt;script&gt;'), 'text should be shown escaped');
};

test('booking-created email escapes address/name and links to the tracking page', async () => {
  await email.sendBookingCreatedEmail({
    customerName: EVIL, customerEmail: "o'brien@example.com", service: 'Plumber',
    date: '2027-01-05', time: '10:00 AM', address: EVIL, price: 250,
    bookingId: 'abc123', workersNotified: 2,
  });
  assertSafe(last().html);
  assert.strictEqual(last().to, "o'brien@example.com"); // recipient is never escaped
  assert.ok(last().html.includes('https://nipungo.example/track/abc123'));
});

test('worker-assigned email escapes worker details and links to tracking', async () => {
  await email.sendWorkerAssignedEmail({
    customerName: 'Asha', customerEmail: 'asha@example.com', service: 'Plumber',
    date: 'd', time: 't', address: EVIL, price: 250, bookingId: 'abc123',
    workerName: EVIL, workerPhone: '9876543210', workerCity: EVIL, workerRating: 4.5, workerExperience: EVIL,
  });
  assertSafe(last().html);
  assert.ok(last().html.includes('/track/abc123'));
});

test('new-job email to the worker escapes the customer-typed fields', async () => {
  await email.sendNewJobEmail({
    workerName: EVIL, workerEmail: 'w@example.com', service: 'Plumber', date: 'd', time: 't',
    address: EVIL, price: 250, bookingId: 'abc123', customerName: EVIL, customerPhone: '9876543210',
  });
  assertSafe(last().html);
  assert.strictEqual(last().to, 'w@example.com');
});

test('welcome, completed and cancelled emails escape names too', async () => {
  await email.sendWelcomeEmail({ name: EVIL, email: 'a@example.com', role: 'customer' });
  assertSafe(last().html);
  await email.sendBookingCompletedEmail({ customerName: EVIL, customerEmail: 'a@example.com', workerName: EVIL, service: 'Plumber', date: 'd', price: 250, bookingId: 'abc123' });
  assertSafe(last().html);
  await email.sendBookingCancelledEmail({ customerName: EVIL, customerEmail: 'a@example.com', service: 'Plumber', date: 'd', price: 250 });
  assertSafe(last().html);
});

test('OTP email shows the code and escapes the name', async () => {
  await email.sendOtpEmail({ name: EVIL, email: 'a@example.com', otp: '123456', purpose: 'register' });
  assertSafe(last().html);
  assert.ok(last().html.includes('123456'));
  assert.ok(last().subject.includes('123456'));
});

test('worker welcome email points at the worker dashboard', async () => {
  await email.sendWelcomeEmail({ name: 'Ravi', email: 'r@example.com', role: 'worker' });
  assert.ok(last().html.includes('https://nipungo.example/worker/dashboard'));
});
