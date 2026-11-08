import { startBooking, stepFlow, summaryText } from './chatFlow';

// Saturday 7 Nov 2026, 10:30 in India (written with the offset so the test means the same anywhere)
const NOW = new Date('2026-11-07T10:30:00+05:30');

const HOME = { label: 'Home', full: '12 MG Road, Flat 4B, Pune - 411001' };
const WORK = { label: 'Work', full: '5 Tech Park, Near Gate 2, Pune - 411057' };

const run = (flow, text, value) => stepFlow(flow, { text, value }, { now: NOW });
const valuesOf = (msg) => msg.options.map((o) => o.value);

describe('a saved default address means fewer questions', () => {
  test('only the day and the time are asked, then the summary appears with the address already filled in', () => {
    let { flow, messages } = startBooking('Plumber', { now: NOW, addresses: [HOME, WORK], note: 'nal tapak raha hai' });
    expect(flow.step).toBe('date');
    expect(messages[0].text).toContain(HOME.full); // shown up front

    let r = run(flow, 'Kal', '2026-11-08');
    expect(r.flow.step).toBe('time');

    r = run(r.flow, '10:00 AM', '10:00 AM');
    // straight to the summary: NO address question, NO note question
    expect(r.flow.step).toBe('confirm');
    expect(r.messages[0].text).toContain(HOME.full);
    expect(r.messages[0].text).toContain('nal tapak raha hai');
    expect(r.messages[0].text).toContain('₹250'); // 200 + 50 fee

    r = run(r.flow, 'haan');
    expect(r.submit).toEqual({
      service: 'Plumber',
      date: '2026-11-08',
      time: '10:00 AM',
      address: HOME.full,
      description: 'nal tapak raha hai',
    });
    expect(r.flow.step).toBe('submitting');
  });

  test('without any saved address it asks once, offering nothing to pick', () => {
    let { flow } = startBooking('Plumber', { now: NOW, addresses: [] });
    let r = run(run(flow, 'kal').flow, '10am');
    expect(r.flow.step).toBe('address');
    r = run(r.flow, 'Flat 9, Green Park, Delhi - 110016');
    expect(r.flow.step).toBe('confirm');
    expect(r.flow.data.address).toBe('Flat 9, Green Park, Delhi - 110016');
  });

  test('a short address is re-asked, not accepted', () => {
    let { flow } = startBooking('Plumber', { now: NOW, addresses: [] });
    const r = run(run(run(flow, 'kal').flow, '10am').flow, 'home');
    expect(r.flow.step).toBe('address');
  });
});

describe('changing things from the summary', () => {
  const atSummary = () => {
    const { flow } = startBooking('Plumber', { now: NOW, addresses: [HOME, WORK], note: 'tap leak' });
    return run(run(flow, 'kal').flow, '11am');
  };

  test('the summary offers address / note / date-time changes', () => {
    const r = atSummary();
    expect(valuesOf(r.messages[0])).toEqual(['__confirm', '__address', '__note', '__restart', '__cancel']);
  });

  test('pick another saved address', () => {
    let r = atSummary();
    r = run(r.flow, 'x', '__address');
    expect(r.flow.step).toBe('address');
    expect(valuesOf(r.messages[0])).toContain(WORK.full);
    r = run(r.flow, WORK.label, WORK.full);
    expect(r.flow.step).toBe('confirm');
    expect(r.flow.data.address).toBe(WORK.full);
    expect(r.messages[0].text).toContain(WORK.full);
  });

  test('"Wapas" returns to the summary unchanged', () => {
    let r = atSummary();
    r = run(r.flow, 'x', '__address');
    r = run(r.flow, 'Wapas', '__back');
    expect(r.flow.step).toBe('confirm');
    expect(r.flow.data.address).toBe(HOME.full);
  });

  test('edit the note, and clear it', () => {
    let r = atSummary();
    r = run(r.flow, 'x', '__note');
    expect(r.flow.step).toBe('note');
    r = run(r.flow, 'ground floor, bell kharab hai');
    expect(r.flow.step).toBe('confirm');
    expect(r.flow.data.description).toBe('ground floor, bell kharab hai');

    r = run(r.flow, 'x', '__note');
    r = run(r.flow, 'x', '__clear');
    expect(r.flow.data.description).toBe('');
    expect(r.messages[0].text).not.toContain('📝 Note');
  });

  test('changing the date/time keeps the address and note', () => {
    let r = atSummary();
    r = run(r.flow, 'x', '__restart');
    expect(r.flow.step).toBe('date');
    expect(r.flow.data.address).toBe(HOME.full);
    expect(r.flow.data.description).toBe('tap leak');
    expect(r.flow.data.date).toBeUndefined();
    r = run(run(r.flow, 'parso').flow, '3 pm');
    expect(r.flow.step).toBe('confirm');
    expect(r.flow.data.date).toBe('2026-11-09');
    expect(r.flow.data.time).toBe('03:00 PM');
    expect(r.flow.data.address).toBe(HOME.full);
  });

  test('anything typed at the summary that is not yes/no re-shows the options', () => {
    const r = run(atSummary().flow, 'hmm');
    expect(r.flow.step).toBe('confirm');
    expect(r.messages[0].options.length).toBe(5);
  });

  test('"no" cancels', () => {
    expect(run(atSummary().flow, 'nahi').flow).toBeNull();
  });
});

describe('dates and times', () => {
  test("today's list starts after the 30-minute lead time (10:30 now -> 11:00 is NOT ok, 02:00 PM is)", () => {
    const { flow } = startBooking('Plumber', { now: NOW, addresses: [HOME] });
    const r = run(flow, 'aaj');
    expect(r.flow.step).toBe('time');
    const slots = valuesOf(r.messages[0]).filter((v) => v !== '__cancel');
    expect(slots).toEqual(['11:00 AM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM']);
  });

  test('typing a time that has already passed is refused', () => {
    const { flow } = startBooking('Plumber', { now: NOW, addresses: [HOME] });
    const t = run(flow, 'aaj');
    const r = run(t.flow, '9am');
    expect(r.flow.step).toBe('time');
    expect(r.messages[0].text).toMatch(/available nahi/);
  });

  test('late in the evening "Aaj" is not offered at all', () => {
    const late = new Date('2026-11-07T18:00:00+05:30');
    const { messages } = startBooking('Plumber', { now: late, addresses: [HOME] });
    expect(messages[0].options.map((o) => o.label).join(' ')).not.toMatch(/Aaj/);
    const r = stepFlow(startBooking('Plumber', { now: late, addresses: [HOME] }).flow, { text: 'aaj' }, { now: late });
    expect(r.flow.step).toBe('date');
  });

  test('past dates, junk and far-future dates are refused', () => {
    const { flow } = startBooking('Plumber', { now: NOW, addresses: [HOME] });
    expect(run(flow, '01/01/2026').flow.step).toBe('date');
    expect(run(flow, 'jaldi').flow.step).toBe('date');
    expect(run(flow, '01/01/2030').flow.step).toBe('date');
  });
});

describe('cancelling', () => {
  test('works at every step', () => {
    const { flow } = startBooking('Plumber', { now: NOW, addresses: [HOME] });
    expect(run(flow, 'cancel').flow).toBeNull();
    const t = run(flow, 'kal');
    expect(run(t.flow, 'x', '__cancel').flow).toBeNull();
  });
});

describe('summaryText', () => {
  test('shows the price with the platform fee and that payment is after the service', () => {
    const text = summaryText({ service: 'Gardener', data: { date: '2026-11-08', time: '10:00 AM', address: HOME.full, description: '' } });
    expect(text).toContain('₹230');
    expect(text).toMatch(/kaam ke baad/);
  });
});
