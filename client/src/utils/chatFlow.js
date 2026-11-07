// The in-chat booking conversation: service -> date -> time -> address ->
// notes -> confirm. Pure functions only (no React, no network), so the whole
// flow is unit-testable. ChatWidget does the API calls.
//
// flow shape: { service, step, data: { date, time, address, description }, lastAddress }
// step: 'date' | 'time' | 'address' | 'description' | 'confirm' | 'submitting'

import { PLATFORM_FEE, SERVICE_ICONS, SERVICE_PRICES, MENU_OPTION } from '../data/chatKnowledge';

// Same slots as pages/Booking.jsx (12:00 PM is intentionally unavailable there too)
export const TIME_SLOTS = [
  '09:00 AM', '10:00 AM', '11:00 AM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM',
];

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const pad = (n) => String(n).padStart(2, '0');

// Local calendar date -> 'YYYY-MM-DD' (never via toISOString, which is UTC)
export const toISODate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const addDays = (d, n) => {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  x.setDate(x.getDate() + n);
  return x;
};

export const formatDate = (iso) => {
  const [y, m, d] = iso.split('-').map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
};

const isRealDate = (y, m, d) => {
  const dt = new Date(y, m - 1, d);
  return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d;
};

// Understands: aaj / kal / parso, 2026-11-09, 09-11-2026, 9/11/2026, 9/11
// Returns 'YYYY-MM-DD' or null.
export const parseDate = (text, now = new Date()) => {
  const t = String(text || '').trim().toLowerCase();
  if (!t) return null;
  if (/^(aaj|today)$/.test(t)) return toISODate(now);
  if (/^(kal|tomorrow)$/.test(t)) return toISODate(addDays(now, 1));
  if (/^(parso|parson|day after( tomorrow)?)$/.test(t)) return toISODate(addDays(now, 2));

  let m = t.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (m) {
    const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
    return isRealDate(y, mo, d) ? `${y}-${pad(mo)}-${pad(d)}` : null;
  }
  m = t.match(/^(\d{1,2})[-/.](\d{1,2})(?:[-/.](\d{2}|\d{4}))?$/);
  if (m) {
    const d = Number(m[1]);
    const mo = Number(m[2]);
    let y = m[3] ? Number(m[3]) : now.getFullYear();
    if (m[3] && m[3].length === 2) y += 2000;
    if (!isRealDate(y, mo, d)) return null;
    // "9/1" typed in November most likely means next January
    if (!m[3] && toISODate(new Date(y, mo - 1, d)) < toISODate(now)) y += 1;
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
  const slot = `${pad(h)}:00 ${ap.toUpperCase()}`;
  return TIME_SLOTS.includes(slot) ? slot : null;
};

const slotHour = (slot) => {
  const [hm, ap] = slot.split(' ');
  let h = Number(hm.split(':')[0]);
  if (ap === 'PM' && h !== 12) h += 12;
  if (ap === 'AM' && h === 12) h = 0;
  return h;
};

// Slots still bookable on `iso` (for today: at least one hour from now)
export const slotsFor = (iso, now = new Date()) =>
  iso === toISODate(now)
    ? TIME_SLOTS.filter((s) => slotHour(s) > now.getHours() + 1 || (slotHour(s) === now.getHours() + 1 && now.getMinutes() === 0))
    : TIME_SLOTS;

const YES = /^(haan|han|haa|ha|yes|y|yep|ok|okay|confirm|kar do|karo|book karo|book kar do|theek hai|thik hai|sahi hai)$/i;
export const isYes = (text) => YES.test(String(text || '').trim());
const NO = /^(nahi|nahin|no|n|na|mat karo)$/i;
const CANCEL = /^(cancel|stop|exit|quit|rehne do|band karo|chhodo|chodo|cancel karo)$/i;

const bot = (text, options) => ({ role: 'bot', text, ...(options ? { options } : {}) });
const opt = (label, value, action = 'flow') => ({ label, action, value });

const dateOptions = (now) => [
  opt(`Aaj (${formatDate(toISODate(now))})`, toISODate(now)),
  opt(`Kal (${formatDate(toISODate(addDays(now, 1)))})`, toISODate(addDays(now, 1))),
  opt(`Parso (${formatDate(toISODate(addDays(now, 2)))})`, toISODate(addDays(now, 2))),
  opt('❌ Cancel', '__cancel'),
];

const timeOptions = (iso, now) => [
  ...slotsFor(iso, now).map((s) => opt(s, s)),
  opt('❌ Cancel', '__cancel'),
];

export const priceLine = (service) => {
  const base = SERVICE_PRICES[service];
  return `₹${base + PLATFORM_FEE} (₹${base} service + ₹${PLATFORM_FEE} platform fee)`;
};

export const summaryText = (flow) => {
  const { service, data } = flow;
  return (
    '📋 Booking summary\n\n' +
    `${SERVICE_ICONS[service] || '🔧'} Service: ${service}\n` +
    `📅 Date: ${formatDate(data.date)}\n` +
    `⏰ Time: ${data.time}\n` +
    `📍 Address: ${data.address}\n` +
    (data.description ? `📝 Note: ${data.description}\n` : '') +
    `💰 Amount: ${priceLine(service)}\n` +
    '💵 Payment: cash after the work is done\n\n' +
    'Kya main ye booking confirm kar doon?'
  );
};

const confirmOptions = () => [
  opt('✅ Haan, confirm karo', '__confirm'),
  opt('✏️ Details badlo', '__restart'),
  opt('❌ Cancel', '__cancel'),
];

const askDate = (flow, now, intro) => ({
  flow: { ...flow, step: 'date' },
  messages: [bot(intro || 'Kis din aana chahiye? Tile chuno ya date likho (jaise 12/11/2026).', dateOptions(now))],
});

// Start the conversation for `service`
export const startBooking = (service, { now = new Date(), lastAddress = null } = {}) => {
  const flow = { service, step: 'date', data: {}, lastAddress };
  const res = askDate(
    flow,
    now,
    `Chaliye ${service} book karte hain. ${SERVICE_ICONS[service] || ''}\n\nKis din aana chahiye? Tile chuno ya date likho (jaise 12/11/2026).`
  );
  return res;
};

const cancelled = () => ({
  flow: null,
  messages: [bot('Theek hai, booking cancel kar di. Aur kuch madad chahiye?', [MENU_OPTION])],
});

// Advance the conversation by one user input.
// input: { text, value }  (value is set when a tile was clicked)
// returns { flow, messages, submit? }  (submit = payload for POST /booking/create)
export const stepFlow = (flow, input, { now = new Date() } = {}) => {
  const raw = String(input.value ?? input.text ?? '').trim();
  const lower = raw.toLowerCase();

  if (raw === '__cancel' || CANCEL.test(lower)) return cancelled();
  if (raw === '__restart') {
    return askDate({ ...flow, data: {} }, now, 'Theek hai, dobara shuru karte hain. Kis din aana chahiye?');
  }

  switch (flow.step) {
    case 'date': {
      const iso = parseDate(raw, now);
      if (!iso) {
        return { flow, messages: [bot('Date samajh nahi aayi. Tile chuno ya aise likho: 12/11/2026', dateOptions(now))] };
      }
      if (iso < toISODate(now)) {
        return { flow, messages: [bot('Ye date nikal chuki hai. Aaj ya aage ki date chuno.', dateOptions(now))] };
      }
      if (iso > toISODate(addDays(now, 60))) {
        return { flow, messages: [bot('Booking sirf agle 60 din tak ho sakti hai. Kam din ki date chuno.', dateOptions(now))] };
      }
      if (slotsFor(iso, now).length === 0) {
        return { flow, messages: [bot('Aaj ke saare slots nikal chuke hain. Kal ya baad ki date chuno.', dateOptions(now))] };
      }
      const next = { ...flow, step: 'time', data: { ...flow.data, date: iso } };
      return {
        flow: next,
        messages: [bot(`📅 ${formatDate(iso)}. Ab time chuno:`, timeOptions(iso, now))],
      };
    }

    case 'time': {
      const slot = TIME_SLOTS.includes(raw) ? raw : parseTime(raw);
      if (!slot || !slotsFor(flow.data.date, now).includes(slot)) {
        return { flow, messages: [bot('Is time pe slot available nahi hai. Tile se chuno:', timeOptions(flow.data.date, now))] };
      }
      const next = { ...flow, step: 'address', data: { ...flow.data, time: slot } };
      const options = [];
      if (flow.lastAddress) options.push(opt(`📍 ${flow.lastAddress}`, flow.lastAddress));
      options.push(opt('❌ Cancel', '__cancel'));
      return {
        flow: next,
        messages: [
          bot(
            `⏰ ${slot}. Ab poora address likho (ghar number, area, city).` +
              (flow.lastAddress ? '\nYa pichla address chuno:' : ''),
            options
          ),
        ],
      };
    }

    case 'address': {
      if (raw.length < 10) {
        return { flow, messages: [bot('Thoda detail mein address likho (kam se kam 10 akshar): ghar number, area, city.')] };
      }
      if (raw.length > 250) {
        return { flow, messages: [bot('Address thoda chhota rakho (250 akshar tak).')] };
      }
      const next = { ...flow, step: 'description', data: { ...flow.data, address: raw } };
      return {
        flow: next,
        messages: [
          bot('Koi extra detail worker ko batani hai? (jaise "bathroom ka nal tapak raha hai") Ya Skip karo.', [
            opt('⏭️ Skip', '__skip'),
            opt('❌ Cancel', '__cancel'),
          ]),
        ],
      };
    }

    case 'description': {
      const note = raw === '__skip' || /^(skip|nahi|no|kuch nahi|none)$/i.test(lower) ? '' : raw.slice(0, 300);
      const next = { ...flow, step: 'confirm', data: { ...flow.data, description: note } };
      return { flow: next, messages: [bot(summaryText(next), confirmOptions())] };
    }

    case 'confirm': {
      if (raw === '__confirm' || YES.test(lower)) {
        const { service, data } = flow;
        return {
          flow: { ...flow, step: 'submitting' },
          messages: [bot('⏳ Booking ho rahi hai...')],
          submit: {
            service,
            date: data.date,
            time: data.time,
            address: data.address,
            description: data.description || '',
          },
        };
      }
      if (NO.test(lower)) return cancelled();
      return { flow, messages: [bot('Confirm karna hai? Neeche se chuno:', confirmOptions())] };
    }

    case 'submitting':
      return { flow, messages: [bot('Ek second, booking process ho rahi hai...')] };

    default:
      return cancelled();
  }
};
