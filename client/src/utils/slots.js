// Booking dates and time slots, in India time (the business runs on IST whatever the
// visitor's device clock says). Mirrors server/config/services.js (TIME_SLOTS, 30-minute
// lead time, 60 days ahead), which is the real authority: the server refuses anything else.

export const TIME_SLOTS = [
  '09:00 AM', '10:00 AM', '11:00 AM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM',
];
export const MIN_LEAD_MINUTES = 30;
export const MAX_DAYS_AHEAD = 60;

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const istFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Kolkata',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

// The date and clock in India right now: { date: 'YYYY-MM-DD', hour, minute }
export const istParts = (now = new Date()) => {
  const p = Object.fromEntries(istFormatter.formatToParts(now).map((x) => [x.type, x.value]));
  return { date: `${p.year}-${p.month}-${p.day}`, hour: Number(p.hour), minute: Number(p.minute) };
};

export const todayIST = (now = new Date()) => istParts(now).date;

// Calendar arithmetic on 'YYYY-MM-DD' strings (no timezones involved)
export const addDaysISO = (iso, n) => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
};

export const isRealDate = (y, m, d) => {
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
};

export const formatDate = (iso) => {
  const [y, m, d] = iso.split('-').map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
};

// "Sat, 7 Nov" for compact chips
export const shortDate = (iso) => {
  const [y, m, d] = iso.split('-').map(Number);
  return `${DAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()]}, ${d} ${MONTHS[m - 1]}`;
};

export const slotHour = (slot) => {
  const [hm, ap] = slot.split(' ');
  let h = Number(hm.split(':')[0]);
  if (ap === 'PM' && h !== 12) h += 12;
  if (ap === 'AM' && h === 12) h = 0;
  return h;
};

// Slots the customer can still book on `iso`:
//  - earlier days: none
//  - today: only slots that start at least MIN_LEAD_MINUTES from now
//  - later days: all of them (up to MAX_DAYS_AHEAD)
export const slotsFor = (iso, now = new Date()) => {
  const today = istParts(now);
  if (iso < today.date || iso > addDaysISO(today.date, MAX_DAYS_AHEAD)) return [];
  if (iso > today.date) return TIME_SLOTS;
  const minutesNow = today.hour * 60 + today.minute;
  return TIME_SLOTS.filter((s) => slotHour(s) * 60 >= minutesNow + MIN_LEAD_MINUTES);
};

// The next `count` days that still have at least one free slot: [{ iso, label, sub }]
export const upcomingDates = (count = 7, now = new Date()) => {
  const today = todayIST(now);
  const out = [];
  for (let i = 0; out.length < count && i < count + 2; i++) {
    const iso = addDaysISO(today, i);
    if (slotsFor(iso, now).length === 0) continue;
    out.push({
      iso,
      label: iso === today ? 'Aaj' : iso === addDaysISO(today, 1) ? 'Kal' : shortDate(iso).split(',')[0],
      sub: shortDate(iso).split(', ')[1],
    });
  }
  return out;
};

// Understands: aaj / kal / parso, 2026-11-09, 09-11-2026, 9/11/2026, 9/11. Returns 'YYYY-MM-DD' or null.
export const parseDate = (text, now = new Date()) => {
  const t = String(text || '').trim().toLowerCase();
  if (!t) return null;
  const today = todayIST(now);
  if (/^(aaj|today)$/.test(t)) return today;
  if (/^(kal|tomorrow)$/.test(t)) return addDaysISO(today, 1);
  if (/^(parso|parson|day after( tomorrow)?)$/.test(t)) return addDaysISO(today, 2);

  const pad = (n) => String(n).padStart(2, '0');
  let m = t.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (m) {
    const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
    return isRealDate(y, mo, d) ? `${y}-${pad(mo)}-${pad(d)}` : null;
  }
  m = t.match(/^(\d{1,2})[-/.](\d{1,2})(?:[-/.](\d{2}|\d{4}))?$/);
  if (m) {
    const d = Number(m[1]);
    const mo = Number(m[2]);
    let y = m[3] ? Number(m[3]) : Number(today.slice(0, 4));
    if (m[3] && m[3].length === 2) y += 2000;
    if (!isRealDate(y, mo, d)) return null;
    // "9/1" typed in November most likely means next January
    if (!m[3] && `${y}-${pad(mo)}-${pad(d)}` < today) y += 1;
    return `${y}-${pad(mo)}-${pad(d)}`;
  }
  return null;
};

// "10", "10am", "10 am", "10:00 AM", "3 pm", "15:00" -> a TIME_SLOTS entry or null
export const parseTime = (text) => {
  const t = String(text || '').trim().toLowerCase().replace(/\./g, '');
  const m = t.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/);
  if (!m) return null;
  let h = Number(m[1]);
  const min = m[2] ? Number(m[2]) : 0;
  if (min !== 0 || h > 23) return null;
  let ap = m[3];
  if (!ap) {
    if (h >= 13) { ap = 'pm'; h -= 12; }
    else if (h === 12) ap = 'pm';
    else ap = h >= 1 && h <= 5 ? 'pm' : 'am'; // "3" means 3 PM, "10" means 10 AM
  }
  if (h < 1 || h > 12) return null;
  const slot = `${String(h).padStart(2, '0')}:00 ${ap.toUpperCase()}`;
  return TIME_SLOTS.includes(slot) ? slot : null;
};
