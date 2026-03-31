const nodemailer = require('nodemailer');

// ── Transporter ─────────────────────────────────────────
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// ── Verify Connection ────────────────────────────────────
transporter.verify((error) => {
  if (error) {
    console.log('❌ Email service error:', error.message);
  } else {
    console.log('✅ Email service ready!');
  }
});

// ════════════════════════════════════════════════════════
// 📌 EMAIL TEMPLATES
// ════════════════════════════════════════════════════════

// ── Base Template ─────────────────────────────────────
const baseTemplate = (content) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>NipunGo</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont,
        'Segoe UI', Roboto, sans-serif;
      background: #f3f4f6;
      padding: 20px;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: white;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0,0,0,0.07);
    }
    .header {
      background: linear-gradient(135deg, #4338ca, #4f46e5);
      padding: 32px 40px;
      text-align: center;
    }
    .logo {
      font-size: 28px;
      font-weight: 800;
      color: white;
      letter-spacing: -0.5px;
    }
    .logo span { color: #fbbf24; }
    .header-subtitle {
      color: #a5b4fc;
      font-size: 14px;
      margin-top: 4px;
    }
    .body { padding: 40px; }
    .greeting {
      font-size: 22px;
      font-weight: 700;
      color: #1f2937;
      margin-bottom: 12px;
    }
    .message {
      color: #6b7280;
      font-size: 15px;
      line-height: 1.6;
      margin-bottom: 24px;
    }
    .card {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      padding: 20px;
      margin: 20px 0;
    }
    .card-title {
      font-size: 12px;
      font-weight: 600;
      color: #9ca3af;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 12px;
    }
    .detail-row {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 0;
      border-bottom: 1px solid #f3f4f6;
      font-size: 14px;
      color: #374151;
    }
    .detail-row:last-child { border-bottom: none; }
    .detail-label {
      color: #9ca3af;
      min-width: 80px;
      font-size: 13px;
    }
    .detail-value { font-weight: 500; }
    .btn {
      display: inline-block;
      background: linear-gradient(135deg, #4338ca, #4f46e5);
      color: white !important;
      text-decoration: none;
      padding: 14px 32px;
      border-radius: 10px;
      font-weight: 600;
      font-size: 15px;
      margin: 20px 0;
      text-align: center;
    }
    .btn-block { display: block; text-align: center; }
    .status-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
    }
    .status-confirmed {
      background: #dbeafe;
      color: #1d4ed8;
    }
    .status-completed {
      background: #d1fae5;
      color: #065f46;
    }
    .status-cancelled {
      background: #fee2e2;
      color: #991b1b;
    }
    .worker-card {
      background: linear-gradient(135deg, #eef2ff, #f5f3ff);
      border: 1px solid #c7d2fe;
      border-radius: 12px;
      padding: 20px;
      margin: 20px 0;
    }
    .worker-avatar {
      width: 48px;
      height: 48px;
      background: #4f46e5;
      border-radius: 12px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 20px;
      font-weight: 700;
      margin-bottom: 12px;
    }
    .worker-name {
      font-size: 18px;
      font-weight: 700;
      color: #1f2937;
    }
    .worker-service {
      color: #6b7280;
      font-size: 14px;
    }
    .phone-link {
      color: #4f46e5;
      font-weight: 700;
      text-decoration: none;
      font-size: 18px;
    }
    .divider {
      height: 1px;
      background: #f3f4f6;
      margin: 24px 0;
    }
    .footer {
      background: #f9fafb;
      padding: 24px 40px;
      text-align: center;
      border-top: 1px solid #f3f4f6;
    }
    .footer p {
      color: #9ca3af;
      font-size: 13px;
      line-height: 1.6;
    }
    .footer a {
      color: #4f46e5;
      text-decoration: none;
    }
    .highlight {
      color: #4f46e5;
      font-weight: 700;
    }
    .price {
      font-size: 24px;
      font-weight: 800;
      color: #f59e0b;
    }
    .alert-box {
      background: #fef3c7;
      border: 1px solid #fde68a;
      border-radius: 10px;
      padding: 14px 18px;
      font-size: 14px;
      color: #92400e;
      margin: 16px 0;
    }
    .success-box {
      background: #d1fae5;
      border: 1px solid #6ee7b7;
      border-radius: 10px;
      padding: 14px 18px;
      font-size: 14px;
      color: #065f46;
      margin: 16px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">Nipun<span>Go</span></div>
      <div class="header-subtitle">
        Professional Home Services
      </div>
    </div>
    <div class="body">
      ${content}
    </div>
    <div class="footer">
      <p>
        © 2024 NipunGo — Made with ❤️ in India<br>
        <a href="${process.env.CLIENT_URL}">
          nipungo.vercel.app
        </a>
      </p>
      <p style="margin-top: 8px; font-size: 11px;">
        Yeh automated email hai. Reply mat karo.
      </p>
    </div>
  </div>
</body>
</html>
`;

// ════════════════════════════════════════════════════════
// 📌 SEND FUNCTIONS
// ════════════════════════════════════════════════════════

// ── 1. Welcome Email ─────────────────────────────────────
const sendWelcomeEmail = async ({ name, email, role }) => {
  const isWorker = role === 'worker';

  const content = `
    <div class="greeting">
      Welcome to NipunGo, ${name}! 🎉
    </div>
    <p class="message">
      ${isWorker
        ? 'Aapka NipunGo par swagat hai! Ab aap apni skills se paise kama sakte hain.'
        : 'Aapka NipunGo par swagat hai! Ab ghar baithe best services book karo.'
      }
    </p>

    <div class="card">
      <div class="card-title">
        ${isWorker ? '👷 Worker Account' : '👤 Customer Account'}
      </div>
      <div class="detail-row">
        <span class="detail-label">Naam</span>
        <span class="detail-value">${name}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Email</span>
        <span class="detail-value">${email}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Role</span>
        <span class="detail-value">
          ${isWorker ? '👷 Worker' : '👤 Customer'}
        </span>
      </div>
    </div>

    ${isWorker ? `
      <div class="alert-box">
        ⏳ Admin verification pending hai.
        Verify hone ke baad requests milni shuru hongi!
      </div>
    ` : `
      <div class="success-box">
        ✅ Account ready hai!
        Abhi apni pehli service book karo.
      </div>
    `}

    <a
      href="${process.env.CLIENT_URL}/services"
      class="btn btn-block"
    >
      ${isWorker ? 'Dashboard Dekho →' : 'Services Dekho →'}
    </a>
  `;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: `Welcome to NipunGo, ${name}! 🎉`,
    html: baseTemplate(content)
  });
};

// ── 2. Booking Created Email (Customer ko) ───────────────
const sendBookingCreatedEmail = async ({
  customerName,
  customerEmail,
  service,
  date,
  time,
  address,
  price,
  bookingId,
  workersNotified
}) => {
  const content = `
    <div class="greeting">
      Booking Request Mili! 🔍
    </div>
    <p class="message">
      <span class="highlight">${customerName}</span>,
      aapki booking request create ho gayi hai.
      Hum aapke liye best worker dhundh rahe hain!
    </p>

    <div class="card">
      <div class="card-title">📋 Booking Details</div>
      <div class="detail-row">
        <span class="detail-label">Service</span>
        <span class="detail-value">${service}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Date</span>
        <span class="detail-value">📅 ${date}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Time</span>
        <span class="detail-value">⏰ ${time}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Address</span>
        <span class="detail-value">📍 ${address}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Amount</span>
        <span class="detail-value price">₹${price}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Booking ID</span>
        <span class="detail-value">
          #${bookingId.toString().slice(-8).toUpperCase()}
        </span>
      </div>
    </div>

    <div class="alert-box">
      🔔 ${workersNotified} workers ko
      request bheji gayi hai.
      Jaise hi koi accept kare,
      aapko email aayegi!
    </div>

    <a
      href="${process.env.CLIENT_URL}/dashboard"
      class="btn btn-block"
    >
      Booking Status Dekho →
    </a>
  `;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: customerEmail,
    subject: `Booking Request Create Ho Gayi! 🔍 — ${service}`,
    html: baseTemplate(content)
  });
};

// ── 3. Worker Assigned Email (Customer ko) ───────────────
const sendWorkerAssignedEmail = async ({
  customerName,
  customerEmail,
  service,
  date,
  time,
  address,
  price,
  bookingId,
  workerName,
  workerPhone,
  workerCity,
  workerRating,
  workerExperience
}) => {
  const content = `
    <div class="greeting">
      Worker Mil Gaya! ✅
    </div>
    <p class="message">
      Khushkhabri!
      <span class="highlight">${customerName}</span>,
      aapki
      <span class="highlight">${service}</span>
      booking ke liye ek verified worker
      assign ho gaya hai.
    </p>

    <div class="worker-card">
      <div class="card-title">👷 Aapka Worker</div>
      <div class="worker-avatar">
        ${workerName.charAt(0).toUpperCase()}
      </div>
      <div class="worker-name">${workerName}</div>
      <div class="worker-service">
        🔧 ${service} Expert
        ${workerCity ? `• 📍 ${workerCity}` : ''}
        ${workerRating ? `• ⭐ ${workerRating}` : ''}
      </div>
      ${workerExperience ? `
        <div style="margin-top: 8px; color: #6b7280; font-size: 13px;">
          💼 Experience: ${workerExperience}
        </div>
      ` : ''}
      <div class="divider"></div>
      <div style="text-align: center; padding: 8px 0;">
        <div style="color: #6b7280; font-size: 13px; margin-bottom: 4px;">
          Worker se contact karo:
        </div>
        <a href="tel:${workerPhone}" class="phone-link">
          📱 ${workerPhone}
        </a>
      </div>
    </div>

    <div class="card">
      <div class="card-title">📋 Booking Details</div>
      <div class="detail-row">
        <span class="detail-label">Service</span>
        <span class="detail-value">${service}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Date</span>
        <span class="detail-value">📅 ${date}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Time</span>
        <span class="detail-value">⏰ ${time}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Address</span>
        <span class="detail-value">📍 ${address}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Amount</span>
        <span class="detail-value price">₹${price}</span>
      </div>
    </div>

    <div class="success-box">
      ✅ Worker confirm ho gaya hai!
      Wo scheduled time pe aapke ghar
      pahunchega. Ready rahiye!
    </div>

    <a
      href="${process.env.CLIENT_URL}/dashboard"
      class="btn btn-block"
    >
      Dashboard Dekho →
    </a>
  `;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: customerEmail,
    subject: `Worker Confirm! ${workerName} aayega — ${service} 🎉`,
    html: baseTemplate(content)
  });
};

// ── 4. New Job Email (Worker ko) ──────────────────────────
const sendNewJobEmail = async ({
  workerName,
  workerEmail,
  service,
  date,
  time,
  address,
  price,
  bookingId,
  customerName,
  customerPhone
}) => {
  const content = `
    <div class="greeting">
      Naya Kaam Mila! 💼
    </div>
    <p class="message">
      <span class="highlight">${workerName}</span>,
      aapne ek booking accept ki hai.
      Customer ki details neeche hain —
      scheduled time pe pahunch jao!
    </p>

    <div class="card">
      <div class="card-title">👤 Customer Details</div>
      <div class="detail-row">
        <span class="detail-label">Naam</span>
        <span class="detail-value">${customerName}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Phone</span>
        <span class="detail-value">
          <a
            href="tel:${customerPhone}"
            style="color: #4f46e5; font-weight: 700;"
          >
            📱 ${customerPhone}
          </a>
        </span>
      </div>
    </div>

    <div class="card">
      <div class="card-title">📋 Job Details</div>
      <div class="detail-row">
        <span class="detail-label">Service</span>
        <span class="detail-value">${service}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Date</span>
        <span class="detail-value">📅 ${date}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Time</span>
        <span class="detail-value">⏰ ${time}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Address</span>
        <span class="detail-value">📍 ${address}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Earning</span>
        <span class="detail-value price">₹${price}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Booking ID</span>
        <span class="detail-value">
          #${bookingId.toString().slice(-8).toUpperCase()}
        </span>
      </div>
    </div>

    <div class="alert-box">
      ⏰ Yaad rakho — Time pe pahunchna
      zaroori hai. Late hone par customer
      ko inform karo!
    </div>

    <a
      href="${process.env.CLIENT_URL}/worker-dashboard"
      class="btn btn-block"
    >
      Dashboard Dekho →
    </a>
  `;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: workerEmail,
    subject: `Naya Job! ${service} — ${date} at ${time} 💼`,
    html: baseTemplate(content)
  });
};

// ── 5. Booking Completed Email (Dono ko) ─────────────────
const sendBookingCompletedEmail = async ({
  customerName,
  customerEmail,
  workerName,
  service,
  date,
  price,
  bookingId
}) => {
  const content = `
    <div class="greeting">
      Kaam Ho Gaya! 🎉
    </div>
    <p class="message">
      <span class="highlight">${customerName}</span>,
      aapki
      <span class="highlight">${service}</span>
      service successfully complete ho gayi hai!
    </p>

    <div class="card">
      <div class="card-title">✅ Completion Summary</div>
      <div class="detail-row">
        <span class="detail-label">Service</span>
        <span class="detail-value">${service}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Worker</span>
        <span class="detail-value">👷 ${workerName}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Date</span>
        <span class="detail-value">📅 ${date}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Amount</span>
        <span class="detail-value price">₹${price}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Status</span>
        <span
          class="status-badge status-completed"
        >
          ✅ Completed
        </span>
      </div>
    </div>

    <div class="success-box">
      🌟 Aapki service complete ho gayi!
      Agar kaam acha laga toh review
      zaroor do — worker ki help hogi!
    </div>

    <a
      href="${process.env.CLIENT_URL}/review/${bookingId}"
      class="btn btn-block"
    >
      ⭐ Review Do →
    </a>
  `;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: customerEmail,
    subject: `Service Complete! ✅ ${service} — Review Do`,
    html: baseTemplate(content)
  });
};

// ── 6. Booking Cancelled Email ────────────────────────────
const sendBookingCancelledEmail = async ({
  customerName,
  customerEmail,
  service,
  date,
  price
}) => {
  const content = `
    <div class="greeting">
      Booking Cancel Ho Gayi ❌
    </div>
    <p class="message">
      <span class="highlight">${customerName}</span>,
      aapki
      <span class="highlight">${service}</span>
      booking cancel ho gayi hai.
    </p>

    <div class="card">
      <div class="card-title">❌ Cancelled Booking</div>
      <div class="detail-row">
        <span class="detail-label">Service</span>
        <span class="detail-value">${service}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Date</span>
        <span class="detail-value">📅 ${date}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Amount</span>
        <span class="detail-value">₹${price}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Status</span>
        <span class="status-badge status-cancelled">
          ❌ Cancelled
        </span>
      </div>
    </div>

    <div class="alert-box">
      💡 Dobara book karna chahte ho?
      Hazaron verified workers available hain!
    </div>

    <a
      href="${process.env.CLIENT_URL}/services"
      class="btn btn-block"
    >
      Dobara Book Karo →
    </a>
  `;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: customerEmail,
    subject: `Booking Cancel — ${service} ❌`,
    html: baseTemplate(content)
  });
};

// ── 7. Password Reset Email ───────────────────────────────
const sendPasswordResetEmail = async ({
  name,
  email,
  resetToken
}) => {
  const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

  const content = `
    <div class="greeting">
      Password Reset Request 🔐
    </div>
    <p class="message">
      <span class="highlight">${name}</span>,
      aapne password reset request ki hai.
      Neeche diye button par click karo
      aur naya password set karo.
    </p>

    <div class="alert-box">
      ⏰ Yeh link sirf
      <strong>15 minutes</strong>
      tak valid hai!
    </div>

    <a href="${resetUrl}" class="btn btn-block">
      🔐 Naya Password Set Karo
    </a>

    <div class="card">
      <div class="card-title">⚠️ Important</div>
      <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
        Agar aapne yeh request nahi ki toh
        is email ko ignore karo.
        Aapka account safe hai.
        <br><br>
        Link kaam na kare toh yeh URL
        copy karo browser mein:
        <br>
        <span style="
          color: #4f46e5;
          font-size: 12px;
          word-break: break-all;
        ">
          ${resetUrl}
        </span>
      </p>
    </div>
  `;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: 'Password Reset — NipunGo 🔐',
    html: baseTemplate(content)
  });
};

// ── Export ────────────────────────────────────────────────
module.exports = {
  sendWelcomeEmail,
  sendBookingCreatedEmail,
  sendWorkerAssignedEmail,
  sendNewJobEmail,
  sendBookingCompletedEmail,
  sendBookingCancelledEmail,
  sendPasswordResetEmail
};