// Single source of truth for service pricing (server-side).
// Keep in sync with servicePrices in client/src/pages/Booking.jsx.
const SERVICE_PRICES = {
  'Plumber': 200,
  'Electrician': 250,
  'Carpenter': 300,
  'Painter': 350,
  'AC Mechanic': 400,
  'Cleaner': 150,
  'Locksmith': 200,
  'Gardener': 180,
  'IT Support': 300,
  'Laundry': 100,
  'Pest Control': 500,
  'Bathroom Fitter': 200,
};

const PLATFORM_FEE = 50;

// Total the customer pays, or null for an unknown service
const getBookingTotal = (service) =>
  Object.prototype.hasOwnProperty.call(SERVICE_PRICES, service)
    ? SERVICE_PRICES[service] + PLATFORM_FEE
    : null;

module.exports = { SERVICE_PRICES, PLATFORM_FEE, getBookingTotal };

// ─────────────────────────────────────────────────────────
// Booking schedule rules (business time is India, UTC+05:30)
// Keep TIME_SLOTS in sync with client/src/utils/slots.js
// ─────────────────────────────────────────────────────────
const TIME_SLOTS = [
  '09:00 AM', '10:00 AM', '11:00 AM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM',
];
const MIN_LEAD_MINUTES = 30;   // a booking must start at least this far from now
const MAX_DAYS_AHEAD = 60;

// "02:00 PM" -> 14
const slotHour24 = (slot) => {
  const [hm, ap] = slot.split(' ');
  let h = Number(hm.split(':')[0]);
  if (ap === 'PM' && h !== 12) h += 12;
  if (ap === 'AM' && h === 12) h = 0;
  return h;
};

// The exact moment a booking starts: '2027-01-05' + '10:00 AM' in IST
const scheduledAt = (date, time) => {
  const hh = String(slotHour24(time)).padStart(2, '0');
  return new Date(`${date}T${hh}:00:00+05:30`);
};

// { ok: true } or { ok: false, message }
const validateSchedule = (date, time, now = new Date()) => {
  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(date))) {
    return { ok: false, message: 'Valid date chuno!' };
  }
  // reject impossible dates like 2027-02-31 that Date would silently roll over
  const probe = new Date(`${date}T00:00:00Z`);
  if (probe.toISOString().slice(0, 10) !== date) return { ok: false, message: 'Valid date chuno!' };
  if (!TIME_SLOTS.includes(time)) return { ok: false, message: 'Valid time slot chuno!' };

  const start = scheduledAt(date, time);
  const earliest = new Date(now.getTime() + MIN_LEAD_MINUTES * 60 * 1000);
  if (start < earliest) {
    return { ok: false, message: 'Yeh time nikal chuka hai. Aage ka time slot chuno!' };
  }
  if (start > new Date(now.getTime() + MAX_DAYS_AHEAD * 24 * 60 * 60 * 1000)) {
    return { ok: false, message: `Booking sirf agle ${MAX_DAYS_AHEAD} din tak ho sakti hai.` };
  }
  return { ok: true };
};

module.exports.TIME_SLOTS = TIME_SLOTS;
module.exports.MIN_LEAD_MINUTES = MIN_LEAD_MINUTES;
module.exports.MAX_DAYS_AHEAD = MAX_DAYS_AHEAD;
module.exports.scheduledAt = scheduledAt;
module.exports.validateSchedule = validateSchedule;
