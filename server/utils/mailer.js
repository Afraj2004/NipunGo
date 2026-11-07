// One place that actually sends email.
//
// Provider order:
//   1. Brevo HTTPS API   (BREVO_API_KEY)          <- use this in production; works on
//                                                    hosts that block SMTP (Render free)
//   2. Gmail SMTP        (EMAIL_USER + EMAIL_PASS) <- fine for local development
//   3. MAIL_DRY_RUN=true  prints the email instead of sending (tests / local checks)
//
// Sender: BREVO_SENDER_EMAIL (+ optional BREVO_SENDER_NAME), or falls back to EMAIL_FROM
// / EMAIL_USER. With Brevo the sender address must be verified in your Brevo account.

const nodemailer = require('nodemailer');

const SEND_TIMEOUT_MS = 15000;

// "NipunGo <a@b.com>"  ->  { name: 'NipunGo', email: 'a@b.com' }
const parseAddress = (value) => {
  const text = String(value || '').trim();
  const m = text.match(/^(.*?)\s*<([^>]+)>$/);
  if (m) return { name: m[1].replace(/^"|"$/g, '').trim() || undefined, email: m[2].trim() };
  return { name: undefined, email: text };
};

const getSender = () => {
  const fromEnv = parseAddress(
    process.env.BREVO_SENDER_EMAIL || process.env.EMAIL_FROM || process.env.EMAIL_USER
  );
  return {
    name: process.env.BREVO_SENDER_NAME || fromEnv.name || 'NipunGo',
    email: fromEnv.email,
  };
};

const getProvider = () => {
  if (process.env.MAIL_DRY_RUN === 'true') return 'dry-run';
  if (process.env.BREVO_API_KEY) return 'brevo';
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) return 'smtp';
  return 'none';
};

let smtpTransport = null;
const getSmtp = () => {
  if (!smtpTransport) {
    smtpTransport = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
      // A blocked SMTP port must fail fast instead of hanging the request
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
    });
  }
  return smtpTransport;
};

const sendViaBrevo = async ({ to, subject, html }) => {
  const sender = getSender();
  if (!sender.email) throw new Error('Brevo sender email missing (set BREVO_SENDER_EMAIL)');

  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': process.env.BREVO_API_KEY,
      'content-type': 'application/json',
      accept: 'application/json',
    },
    body: JSON.stringify({
      sender,
      to: [{ email: to }],
      subject,
      htmlContent: html,
    }),
    signal: AbortSignal.timeout(SEND_TIMEOUT_MS),
  });

  if (!res.ok) {
    const detail = (await res.text().catch(() => '')).slice(0, 200);
    throw new Error(`Brevo ${res.status}: ${detail}`);
  }
};

// { to, subject, html, text? }  (`from` in older callers is ignored; sender comes from env)
const sendMail = async ({ to, subject, html, text }) => {
  const provider = getProvider();

  if (provider === 'dry-run') {
    console.log(`[mail:dry-run] to=${to} | subject=${subject} | text=${text || ''}`);
    return;
  }
  if (provider === 'brevo') return sendViaBrevo({ to, subject, html });
  if (provider === 'smtp') {
    const sender = getSender();
    await getSmtp().sendMail({
      from: sender.name ? `"${sender.name}" <${sender.email}>` : sender.email,
      to,
      subject,
      html,
    });
    return;
  }
  throw new Error('Email is not configured (set BREVO_API_KEY or EMAIL_USER/EMAIL_PASS)');
};

const describe = () => {
  const provider = getProvider();
  if (provider === 'brevo') return `Brevo API (sender: ${getSender().email || 'MISSING'})`;
  if (provider === 'smtp') return 'Gmail SMTP (may be blocked on free hosting)';
  if (provider === 'dry-run') return 'DRY RUN (emails are printed, not sent)';
  return 'NOT CONFIGURED - emails and OTPs cannot be sent';
};

module.exports = { sendMail, getProvider, getSender, parseAddress, describe };
