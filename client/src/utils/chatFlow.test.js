import {
  TIME_SLOTS,
  parseDate,
  parseTime,
  slotsFor,
  startBooking,
  stepFlow,
  toISODate,
} from './chatFlow';

// Saturday 7 Nov 2026, 10:30 local time
const NOW = new Date(2026, 10, 7, 10, 30);

describe('parseDate', () => {
  test('understands aaj / kal / parso', () => {
    expect(parseDate('aaj', NOW)).toBe('2026-11-07');
    expect(parseDate('Kal', NOW)).toBe('2026-11-08');
    expect(parseDate('parso', NOW)).toBe('2026-11-09');
  });

  test('understands typed dates', () => {
    expect(parseDate('2026-11-12', NOW)).toBe('2026-11-12');
    expect(parseDate('12/11/2026', NOW)).toBe('2026-11-12');
    expect(parseDate('12-11-26', NOW)).toBe('2026-11-12');
    expect(parseDate('12/11', NOW)).toBe('2026-11-12');
  });

  test('a date without a year that already passed means next year', () => {
    expect(parseDate('5/1', NOW)).toBe('2027-01-05');
  });

  test('rejects nonsense and impossible dates', () => {
    expect(parseDate('whenever', NOW)).toBeNull();
    expect(parseDate('31/02/2026', NOW)).toBeNull();
    expect(parseDate('', NOW)).toBeNull();
  });
});

describe('parseTime', () => {
  test('maps typed times onto the real slots', () => {
    expect(parseTime('10')).toBe('10:00 AM');
    expect(parseTime('10am')).toBe('10:00 AM');
    expect(parseTime('3 pm')).toBe('03:00 PM');
    expect(parseTime('3')).toBe('03:00 PM');
    expect(parseTime('15:00')).toBe('03:00 PM');
    expect(parseTime('9:00 AM')).toBe('09:00 AM');
  });

  test('rejects times that are not bookable slots', () => {
    expect(parseTime('12')).toBeNull(); // 12:00 PM is not offered
    expect(parseTime('7pm')).toBeNull();
    expect(parseTime('10:30')).toBeNull();
    expect(parseTime('abc')).toBeNull();
  });
});

describe('slotsFor', () => {
  test('future days offer every slot', () => {
    expect(slotsFor('2026-11-08', NOW)).toEqual(TIME_SLOTS);
  });

  test('today only offers slots at least an hour away', () => {
    // it is 10:30, so 09/10/11 AM are gone
    expect(slotsFor('2026-11-07', NOW)).toEqual(
      ['02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM']
    );
  });

  test('late in the day nothing is left', () => {
    expect(slotsFor('2026-11-07', new Date(2026, 10, 7, 17, 0))).toEqual([]);
  });
});

describe('booking conversation', () => {
  const run = (flow, text, value) => stepFlow(flow, { text, value }, { now: NOW });

  test('happy path ends in a submit payload with the right details', () => {
    let { flow, messages } = startBooking('Plumber', { now: NOW, addresses: [] });
    expect(flow.step).toBe('date');
    expect(messages[0].options.length).toBeGreaterThan(2);

    let r = run(flow, 'Kal', '2026-11-08');
    expect(r.flow.step).toBe('time');

    r = run(r.flow, '10:00 AM', '10:00 AM');
    expect(r.flow.step).toBe('address');

    r = run(r.flow, '202 Block B, Isha Casablanca, Panathur, Bengaluru');
    expect(r.flow.step).toBe('description');

    r = run(r.flow, 'nal tapak raha hai');
    expect(r.flow.step).toBe('confirm');
    expect(r.messages[0].text).toContain('Plumber');
    expect(r.messages[0].text).toContain('₹250'); // 200 + 50 fee

    r = run(r.flow, 'haan');
    expect(r.submit).toEqual({
      service: 'Plumber',
      date: '2026-11-08',
      time: '10:00 AM',
      address: '202 Block B, Isha Casablanca, Panathur, Bengaluru',
      description: 'nal tapak raha hai',
    });
    expect(r.flow.step).toBe('submitting');
  });

  test('every saved address is offered as a tile, and picking one is accepted', () => {
    const addresses = [
      { label: 'Home', full: '12 MG Road, Pune - 411001' },
      { label: 'Work', full: '5 Tech Park, Near Gate 2, Pune - 411057' },
    ];
    let { flow } = startBooking('Cleaner', { now: NOW, addresses });
    let r = run(flow, 'kal');
    r = run(r.flow, '11am');
    const tiles = r.messages[0].options.filter((o) => o.value !== '__cancel');
    expect(tiles.map((o) => o.value)).toEqual(addresses.map((a) => a.full));
    expect(tiles[0].label).toContain('Home');

    r = run(r.flow, tiles[1].label, tiles[1].value);
    expect(r.flow.step).toBe('description');
    expect(r.flow.data.address).toBe(addresses[1].full);
  });

  test('bad input is re-asked, not accepted', () => {
    const { flow } = startBooking('Plumber', { now: NOW });
    let r = run(flow, 'jaldi');
    expect(r.flow.step).toBe('date');

    r = run(flow, '01/01/2026'); // in the past
    expect(r.flow.step).toBe('date');

    r = run(flow, 'kal');
    r = run(r.flow, '7pm');
    expect(r.flow.step).toBe('time');

    r = run(run(r.flow, '10am').flow, 'short');
    expect(r.flow.step).toBe('address');
  });

  test("today is refused once today's slots are over", () => {
    const late = new Date(2026, 10, 7, 18, 0);
    const { flow } = startBooking('Plumber', { now: late });
    const r = stepFlow(flow, { text: 'aaj' }, { now: late });
    expect(r.flow.step).toBe('date');
  });

  test('cancel works at any step', () => {
    const { flow } = startBooking('Plumber', { now: NOW });
    expect(run(flow, 'cancel').flow).toBeNull();
    const r = run(run(flow, 'kal').flow, 'x', '__cancel');
    expect(r.flow).toBeNull();
  });

  test('"Details badlo" restarts from the date', () => {
    const { flow } = startBooking('Plumber', { now: NOW });
    const r = run(flow, 'kal');
    const back = run(r.flow, '', '__restart');
    expect(back.flow.step).toBe('date');
    expect(back.flow.data).toEqual({});
  });

  test('skipping the note submits an empty description', () => {
    let { flow } = startBooking('Plumber', { now: NOW });
    let r = run(flow, 'kal');
    r = run(r.flow, '10am');
    r = run(r.flow, 'Flat 4, Green Park, Delhi');
    r = run(r.flow, '', '__skip');
    r = run(r.flow, '', '__confirm');
    expect(r.submit.description).toBe('');
  });

  test('toISODate uses the local calendar date', () => {
    expect(toISODate(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05');
  });
});
