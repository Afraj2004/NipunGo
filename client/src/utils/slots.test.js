import {
  TIME_SLOTS,
  istParts,
  todayIST,
  addDaysISO,
  slotsFor,
  upcomingDates,
  parseDate,
  parseTime,
  formatDate,
  shortDate,
} from './slots';

// Sat 7 Nov 2026, 10:30 in India
const NOW = new Date('2026-11-07T10:30:00+05:30');

describe('India time, whatever the device clock says', () => {
  test('istParts reads the date and clock in India', () => {
    expect(istParts(NOW)).toEqual({ date: '2026-11-07', hour: 10, minute: 30 });
  });

  test('just after midnight UTC is already the next morning in India', () => {
    const t = new Date('2026-11-07T20:00:00Z'); // 01:30 on the 8th in India
    expect(todayIST(t)).toBe('2026-11-08');
    expect(istParts(t).hour).toBe(1);
  });

  test('a late-evening UTC time can still be "yesterday" for a device in the US, but not for us', () => {
    const t = new Date('2026-11-07T03:00:00Z'); // 08:30 India, evening before in New York
    expect(todayIST(t)).toBe('2026-11-07');
  });

  test('addDaysISO handles month and year ends', () => {
    expect(addDaysISO('2026-11-30', 1)).toBe('2026-12-01');
    expect(addDaysISO('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDaysISO('2028-02-28', 1)).toBe('2028-02-29');
    expect(addDaysISO('2026-11-07', -7)).toBe('2026-10-31');
  });
});

describe('slotsFor', () => {
  test('earlier days have none', () => {
    expect(slotsFor('2026-11-06', NOW)).toEqual([]);
  });

  test('later days have all of them', () => {
    expect(slotsFor('2026-11-08', NOW)).toEqual(TIME_SLOTS);
  });

  test('today keeps only slots at least 30 minutes away (10:30 now)', () => {
    expect(slotsFor('2026-11-07', NOW)).toEqual(['11:00 AM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM']);
  });

  test('exactly 30 minutes ahead is still allowed (10:30 for an 11:00 slot), 29 is not', () => {
    expect(slotsFor('2026-11-07', new Date('2026-11-07T10:30:00+05:30'))).toContain('11:00 AM');
    expect(slotsFor('2026-11-07', new Date('2026-11-07T10:31:00+05:30'))).not.toContain('11:00 AM');
  });

  test('after the last slot nothing is left today', () => {
    expect(slotsFor('2026-11-07', new Date('2026-11-07T17:00:00+05:30'))).toEqual([]);
  });

  test('up to 60 days ahead is bookable, beyond that is refused', () => {
    expect(slotsFor('2027-01-06', NOW).length).toBeGreaterThan(0); // 60 days from 7 Nov
    expect(slotsFor('2027-01-07', NOW)).toEqual([]);
    expect(slotsFor('2027-02-01', NOW)).toEqual([]);
  });
});

describe('upcomingDates', () => {
  test('starts with today while slots remain, labelled Aaj / Kal', () => {
    const d = upcomingDates(4, NOW);
    expect(d.map((x) => x.iso)).toEqual(['2026-11-07', '2026-11-08', '2026-11-09', '2026-11-10']);
    expect(d[0].label).toBe('Aaj');
    expect(d[1].label).toBe('Kal');
    expect(d[2].label).toBe('Mon');
  });

  test('skips today once its slots are over', () => {
    const d = upcomingDates(3, new Date('2026-11-07T18:00:00+05:30'));
    expect(d[0].iso).toBe('2026-11-08');
    expect(d[0].label).toBe('Kal');
  });
});

describe('parseDate / parseTime', () => {
  test('understands aaj / kal / parso and typed dates', () => {
    expect(parseDate('Aaj', NOW)).toBe('2026-11-07');
    expect(parseDate('kal', NOW)).toBe('2026-11-08');
    expect(parseDate('parso', NOW)).toBe('2026-11-09');
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

  test('times map onto the real slots, others are refused', () => {
    expect(parseTime('10')).toBe('10:00 AM');
    expect(parseTime('3 pm')).toBe('03:00 PM');
    expect(parseTime('15:00')).toBe('03:00 PM');
    expect(parseTime('12')).toBeNull();
    expect(parseTime('7pm')).toBeNull();
    expect(parseTime('10:30')).toBeNull();
  });

  test('formatting', () => {
    expect(formatDate('2026-11-07')).toBe('7 Nov 2026');
    expect(shortDate('2026-11-07')).toBe('Sat, 7 Nov');
  });
});
