const test = require('node:test');
const assert = require('node:assert');
const { parseAddress, getProvider, getSender } = require('../utils/mailer');

const withEnv = (vars, fn) => {
  const keys = ['BREVO_API_KEY', 'EMAIL_USER', 'EMAIL_PASS', 'MAIL_DRY_RUN', 'EMAIL_FROM', 'BREVO_SENDER_EMAIL', 'BREVO_SENDER_NAME'];
  const saved = Object.fromEntries(keys.map((k) => [k, process.env[k]]));
  keys.forEach((k) => delete process.env[k]);
  Object.assign(process.env, vars);
  try { fn(); } finally {
    keys.forEach((k) => (saved[k] === undefined ? delete process.env[k] : (process.env[k] = saved[k])));
  }
};

test('parseAddress understands "Name <email>" and plain emails', () => {
  assert.deepStrictEqual(parseAddress('NipunGo <hello@nipungo.com>'), { name: 'NipunGo', email: 'hello@nipungo.com' });
  assert.deepStrictEqual(parseAddress('hello@nipungo.com'), { name: undefined, email: 'hello@nipungo.com' });
});

test('Brevo wins over SMTP, SMTP over nothing', () => {
  withEnv({ BREVO_API_KEY: 'k', EMAIL_USER: 'u', EMAIL_PASS: 'p' }, () => assert.strictEqual(getProvider(), 'brevo'));
  withEnv({ EMAIL_USER: 'u', EMAIL_PASS: 'p' }, () => assert.strictEqual(getProvider(), 'smtp'));
  withEnv({}, () => assert.strictEqual(getProvider(), 'none'));
  withEnv({ MAIL_DRY_RUN: 'true', BREVO_API_KEY: 'k' }, () => assert.strictEqual(getProvider(), 'dry-run'));
});

test('sender comes from BREVO_SENDER_EMAIL, then EMAIL_FROM', () => {
  withEnv({ BREVO_SENDER_EMAIL: 'a@x.com', EMAIL_FROM: 'b@x.com' }, () => assert.strictEqual(getSender().email, 'a@x.com'));
  withEnv({ EMAIL_FROM: 'NipunGo <b@x.com>' }, () => assert.deepStrictEqual(getSender(), { name: 'NipunGo', email: 'b@x.com' }));
});
