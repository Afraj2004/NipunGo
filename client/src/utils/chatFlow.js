// The in-chat booking conversation. Pure functions only (no React, no network), so the whole
// flow is unit-testable. ChatWidget does the API calls.
//
//   service -> date -> time -> SUMMARY -> confirm
//
// It asks as little as possible: the customer's default saved address and the problem they
// already described are filled in, so the only questions are "which day?" and "what time?".
// Everything else (address, note, date/time) can be changed from the summary screen.
//
// flow shape: { service, step, data: { date, time, address, description }, addresses }
// step: 'date' | 'time' | 'address' | 'note' | 'confirm' | 'submitting'

import { PLATFORM_FEE, SERVICE_ICONS, SERVICE_PRICES, MENU_OPTION } from '../data/chatKnowledge';
import {
  TIME_SLOTS,
  slotsFor,
  parseDate,
  parseTime,
  formatDate,
  todayIST,
  addDaysISO,
  MAX_DAYS_AHEAD,
} from './slots';

export { TIME_SLOTS, slotsFor, parseDate, parseTime, formatDate };

const YES = /^(haan|han|haa|ha|yes|y|yep|ok|okay|confirm|kar do|karo|book karo|book kar do|theek hai|thik hai|sahi hai)$/i;
const NO = /^(nahi|nahin|no|n|na|mat karo)$/i;
const CANCEL = /^(cancel|stop|exit|quit|rehne do|band karo|chhodo|chodo|cancel karo)$/i;
export const isYes = (text) => YES.test(String(text || '').trim());

const bot = (text, options) => ({ role: 'bot', text, ...(options ? { options } : {}) });
const opt = (label, value, action = 'flow') => ({ label, action, value });
const CANCEL_OPT = opt('❌ Cancel', '__cancel');

export const priceLine = (service) => {
  const base = SERVICE_PRICES[service];
  return `₹${base + PLATFORM_FEE} (₹${base} service + ₹${PLATFORM_FEE} platform fee)`;
};

const dateOptions = (now) => {
  const today = todayIST(now);
  const out = [];
  [['Aaj', 0], ['Kal', 1], ['Parso', 2]].forEach(([label, n]) => {
    const iso = addDaysISO(today, n);
    if (slotsFor(iso, now).length) out.push(opt(`${label} (${formatDate(iso)})`, iso));
  });
  out.push(CANCEL_OPT);
  return out;
};

const timeOptions = (iso, now) => [...slotsFor(iso, now).map((s) => opt(s, s)), CANCEL_OPT];

export const summaryText = (flow) => {
  const { service, data } = flow;
  return (
    '📋 Booking summary\n\n' +
    `${SERVICE_ICONS[service] || '🔧'} Service: ${service}\n` +
    `📅 Date: ${formatDate(data.date)}\n` +
    `⏰ Time: ${data.time}\n` +
    `📍 Address: ${data.address || 'abhi nahi diya'}\n` +
    (data.description ? `📝 Note: ${data.description}\n` : '') +
    `💰 Amount: ${priceLine(service)}\n` +
    '💵 Payment: kaam ke baad (cash / UPI / card)\n\n' +
    'Sab theek hai? Confirm karoge to main booking kar dunga.'
  );
};

const summaryOptions = (flow) => [
  opt('✅ Haan, confirm karo', '__confirm'),
  opt(flow.data.address ? '📍 Address badlo' : '📍 Address add karo', '__address'),
  opt(flow.data.description ? '📝 Note badlo' : '📝 Note add karo', '__note'),
  opt('✏️ Date / time badlo', '__restart'),
  CANCEL_OPT,
];

const showSummary = (flow) => ({
  flow: { ...flow, step: 'confirm' },
  messages: [bot(summaryText(flow), summaryOptions(flow))],
});

const askDate = (flow, now, intro) => {
  const options = dateOptions(now);
  if (options.length === 1) {
    return {
      flow: null,
      messages: [bot('Aaj ya agle kuch din ke liye koi slot nahi bacha. Thodi der baad try karo.', [MENU_OPTION])],
    };
  }
  return {
    flow: { ...flow, step: 'date' },
    messages: [bot(intro || 'Kis din aana chahiye? Tile chuno ya date likho (jaise 12/11/2026).', options)],
  };
};

const addressTiles = (flow) => [
  ...(flow.addresses || []).slice(0, 5).map((a) => opt(`📍 ${a.label}: ${a.full}`, a.full)),
  opt('⬅️ Wapas', '__back'),
  CANCEL_OPT,
];

// Start the conversation for `service`.
//   addresses: saved addresses ([{ label, full }]), default first. The first one is used automatically.
//   note: what the customer already told us about the problem (saved as the booking note)
export const startBooking = (service, { now = new Date(), addresses = [], note = '' } = {}) => {
  const flow = {
    service,
    step: 'date',
    data: { address: addresses[0]?.full || '', description: String(note || '').trim().slice(0, 300) },
    addresses,
  };
  return askDate(
    flow,
    now,
    `Chaliye ${service} book karte hain. ${SERVICE_ICONS[service] || ''}\n\n` +
      (flow.data.address
        ? `📍 Address: ${flow.data.address}\n\n`
        : '') +
      'Kis din aana chahiye? Tile chuno ya date likho (jaise 12/11/2026).'
  );
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

  // From the summary: jump to the thing they want to change
  if (flow.step === 'confirm') {
    if (raw === '__restart') {
      return askDate({ ...flow, data: { ...flow.data, date: undefined, time: undefined } }, now,
        'Theek hai. Kis din aana chahiye?');
    }
    if (raw === '__address') {
      return {
        flow: { ...flow, step: 'address' },
        messages: [bot(
          'Naya address likho (ghar number, area, city)' +
            ((flow.addresses || []).length ? ', ya saved address chuno:' : ':'),
          addressTiles(flow)
        )],
      };
    }
    if (raw === '__note') {
      return {
        flow: { ...flow, step: 'note' },
        messages: [bot(
          'Worker ko kya batana hai? (jaise "bathroom ka nal tapak raha hai")',
          [
            ...(flow.data.description ? [opt('🗑️ Note hatao', '__clear')] : []),
            opt('⬅️ Wapas', '__back'),
            CANCEL_OPT,
          ]
        )],
      };
    }
  }

  switch (flow.step) {
    case 'date': {
      const iso = parseDate(raw, now);
      if (!iso) {
        return { flow, messages: [bot('Date samajh nahi aayi. Tile chuno ya aise likho: 12/11/2026', dateOptions(now))] };
      }
      if (iso < todayIST(now)) {
        return { flow, messages: [bot('Ye date nikal chuki hai. Aaj ya aage ki date chuno.', dateOptions(now))] };
      }
      if (iso > addDaysISO(todayIST(now), MAX_DAYS_AHEAD)) {
        return { flow, messages: [bot(`Booking sirf agle ${MAX_DAYS_AHEAD} din tak ho sakti hai. Kam din ki date chuno.`, dateOptions(now))] };
      }
      if (slotsFor(iso, now).length === 0) {
        return { flow, messages: [bot('Aaj ke saare slots nikal chuke hain. Kal ya baad ki date chuno.', dateOptions(now))] };
      }
      return {
        flow: { ...flow, step: 'time', data: { ...flow.data, date: iso } },
        messages: [bot(`📅 ${formatDate(iso)}. Ab time chuno:`, timeOptions(iso, now))],
      };
    }

    case 'time': {
      const slot = TIME_SLOTS.includes(raw) ? raw : parseTime(raw);
      if (!slot || !slotsFor(flow.data.date, now).includes(slot)) {
        return { flow, messages: [bot('Is time pe slot available nahi hai. Tile se chuno:', timeOptions(flow.data.date, now))] };
      }
      const next = { ...flow, data: { ...flow.data, time: slot } };
      // A saved default address is used straight away: go to the summary, don't ask again
      if (next.data.address) return showSummary(next);
      return {
        flow: { ...next, step: 'address' },
        messages: [bot(
          `⏰ ${slot}. Ab address batao.` +
            ((flow.addresses || []).length
              ? '\nSaved address chuno ya naya poora address likho (ghar number, area, city):'
              : ' Poora address likho (ghar number, area, city).'),
          addressTiles({ ...flow, addresses: flow.addresses })
        )],
      };
    }

    case 'address': {
      if (raw === '__back') return flow.data.address ? showSummary(flow) : cancelled();
      if (raw.length < 10) {
        return { flow, messages: [bot('Thoda detail mein address likho (kam se kam 10 akshar): ghar number, area, city.')] };
      }
      if (raw.length > 250) {
        return { flow, messages: [bot('Address thoda chhota rakho (250 akshar tak).')] };
      }
      return showSummary({ ...flow, data: { ...flow.data, address: raw } });
    }

    case 'note': {
      if (raw === '__back') return showSummary(flow);
      const note = raw === '__clear' ? '' : raw.slice(0, 300);
      return showSummary({ ...flow, data: { ...flow.data, description: note } });
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
      return { flow, messages: [bot('Confirm karna hai? Neeche se chuno:', summaryOptions(flow))] };
    }

    case 'submitting':
      return { flow, messages: [bot('Ek second, booking process ho rahi hai...')] };

    default:
      return cancelled();
  }
};
