/**
 * What the golden vectors cannot say: input handling, the cut rules of the strings,
 * the structure of the year, and facts written from the specification.
 */

import { NaturalDate } from '../src/index';

const DAY = 86400000;
// Year 1 opens here at longitude 180: the winter solstice noon, 2012-12-21 12:00 UTC
const YEAR_1 = 1356091200000;
const at180 = (ms: number) => new NaturalDate(YEAR_1 + ms, 180);

describe('input', () => {
  const iso = '2023-01-01T12:00:00Z';

  test('a Date, a number and a string name the same moment', () => {
    const fromDate = new NaturalDate(new Date(iso), 2);
    expect(new NaturalDate(Date.parse(iso), 2)).toEqual(fromDate);
    expect(new NaturalDate(iso, 2)).toEqual(fromDate);
    expect(new NaturalDate('2023-01-01T13:00:00+01:00', 2)).toEqual(fromDate);
    expect(fromDate.unixTime).toBe(Date.parse(iso));
  });

  test('null and undefined are now, 0 is the epoch', () => {
    for (const nothing of [null, undefined]) {
      const before = Date.now();
      const { unixTime } = new NaturalDate(nothing, 0);
      expect(unixTime).toBeGreaterThanOrEqual(before);
      expect(unixTime).toBeLessThanOrEqual(Date.now());
    }
    expect(new NaturalDate(0, 0).unixTime).toBe(0);
  });

  test('an invalid date throws', () => {
    for (const bad of ['not a date', NaN, new Date(NaN)]) {
      expect(() => new NaturalDate(bad, 0)).toThrow('Invalid date');
    }
  });

  test('longitude defaults to 0, accepts both ends, refuses the rest', () => {
    expect(new NaturalDate(iso).longitude).toBe(0);
    for (const ok of [-180, 180]) expect(new NaturalDate(iso, ok).longitude).toBe(ok);
    for (const bad of [-181, 181, NaN, Infinity, -Infinity, '5' as any, null as any]) {
      expect(() => new NaturalDate(iso, bad)).toThrow('Longitude');
    }
  });
});

describe('precision cuts the longitude the clock runs on, never rounds it', () => {
  test.each([
    [2.3522, 0, 2], [2.3522, 1, 2.3], [2.3522, 2, 2.35], [-2.9, 0, -2], [2.3522, Infinity, 2.3522],
  ])('longitude %p at precision %p runs on %p', (longitude, precision, effective) => {
    const nd = new NaturalDate(YEAR_1, longitude, precision);
    expect(nd.effectiveLongitude).toBeCloseTo(effective, 12);
    expect(nd.longitude).toBe(longitude);
    expect(nd.precision).toBe(precision);
  });

  test('precision is 0 by default, and moves the midnight by the degrees cut', () => {
    const zone = new NaturalDate(YEAR_1 + 50 * DAY, 2.9);
    const exact = new NaturalDate(YEAR_1 + 50 * DAY, 2.9, Infinity);
    expect(zone.precision).toBe(0);
    expect(zone.effectiveLongitude).toBe(2);
    expect(zone.nadir - exact.nadir).toBeCloseTo(0.9 * DAY / 360, -1);
  });
});

describe('time', () => {
  test('0° at midnight, 180° at midday, 360° never reached', () => {
    expect(at180(0).time).toBe(0);
    expect(at180(DAY / 2).time).toBe(180);
    expect(at180(DAY - 1).time).toBeLessThan(360);
    const next = at180(DAY);
    expect([next.time, next.dayOfYear, next.day]).toEqual([0, 2, 1]);
    expect(at180(-1).day).toBe(-1);
    expect(at180(0).day).toBe(0);
  });

  test('the same instant at three longitudes: time distance NT-30, NT+0, NT+40 is 90°, 120°, 160°', () => {
    const t = '2023-01-01T08:00:00Z';
    const times = [-30, 0, 40].map((longitude) => new NaturalDate(t, longitude, Infinity).time);
    times.forEach((time, i) => expect(time).toBeCloseTo([90, 120, 160][i], 9));
  });

  test('midnight and midday at longitude 0 are midnight and midday UTC', () => {
    expect(new NaturalDate('2023-01-01T00:00:00Z', 0).time).toBeCloseTo(0, 9);
    expect(new NaturalDate('2023-01-01T12:00:00Z', 0).time).toBeCloseTo(180, 9);
  });

  test('getTimeOfEvent: inside, both ends inclusive, outside', () => {
    const nd = at180(1000);
    expect(nd.getTimeOfEvent(nd.nadir)).toBe(0);
    expect(nd.getTimeOfEvent(nd.nadir + DAY / 2)).toBe(180);
    expect(nd.getTimeOfEvent(nd.nadir + DAY)).toBe(360);
    expect(nd.getTimeOfEvent(nd.nadir - 1)).toBe(false);
    expect(nd.getTimeOfEvent(nd.nadir + DAY + 1)).toBe(false);
    expect(nd.getTimeOfEvent(new Date(nd.nadir + DAY / 4))).toBe(90);
    expect(nd.getTimeOfEvent(new Date(nd.nadir + DAY / 4).toISOString())).toBe(90);
  });
});

describe('strings', () => {
  // 202.996° is 48719040 ms after midnight
  test('the time is cut to its decimals, never rounded', () => {
    const nd = at180(48719040);
    expect(nd.toTimeString()).toBe('202°99');
    expect(nd.toTimeString(0)).toBe('202°');
    expect(nd.toTimeString(1)).toBe('202°9');
    expect(nd.toTimeString(3)).toBe('202°996');
    expect(at180(0).toTimeString()).toBe('000°00');
    expect(at180(DAY - 1).toTimeString()).toBe('359°99');
    expect(at180(DAY - 1).toTimeString(0)).toBe('359°');
  });

  test('the longitude label is cut at the decimals of precision, or at the decimals asked', () => {
    const label = (longitude: number, precision: number, decimals?: number) =>
        new NaturalDate(YEAR_1, longitude, precision).toLongitudeString(decimals);
    expect(label(2.96, 0)).toBe('NT+2');
    expect(label(2.96, 1)).toBe('NT+2.9');
    expect(label(2.96, 0, 2)).toBe('NT+2.96');
    expect(label(2.999, 0, 2)).toBe('NT+2.99');
    expect(label(-73.25, Infinity)).toBe('NT-73');
    expect(label(-73.25, Infinity, 2)).toBe('NT-73.25');
    expect(label(5.12345, 2, 4)).toBe('NT+5.1234');
    expect(label(-180, 0)).toBe('NT-180');
    expect(label(180, 0)).toBe('NT+180');
  });

  test('NTZ only when nothing is left after the cut', () => {
    expect(new NaturalDate(YEAR_1, 0).toLongitudeString()).toBe('NTZ');
    expect(new NaturalDate(YEAR_1, -0.7).toLongitudeString()).toBe('NTZ');
    expect(new NaturalDate(YEAR_1, 0.04, 1).toLongitudeString()).toBe('NTZ');
    expect(new NaturalDate(YEAR_1, -0.7).toLongitudeString(1)).toBe('NT-0.7');
    expect(new NaturalDate(YEAR_1, 0.04).toLongitudeString(2)).toBe('NT+0.04');
  });

  test('toString joins date, time and longitude; the date takes any separator', () => {
    const nd = at180(0);
    expect(nd.toString()).toBe('001)01)01 000°00 NT+180');
    expect(nd.toDateString('/')).toBe('001/01/01');
    expect(at180(364 * DAY).toDateString('-')).toBe('001-RAINBOW');
  });

  test('negative years carry a sign', () => {
    expect(at180(-1).toYearString()).toBe('000');
    expect(at180(-2 * 365 * DAY).toYearString()).toBe('-001');
    expect(at180(-10 * 365 * DAY).toYearString()).toBe('-009');
    expect(at180(-10 * 365 * DAY).toDateString()).toMatch(/^-009\)\d\d\)\d\d$/);
  });
});

describe('the year', () => {
  test('year 1 starts at 1356091200000 at longitude 180', () => {
    const nd = at180(0);
    expect(nd.yearStart).toBe(YEAR_1);
    expect(nd.year).toBe(1);
    expect(nd.nadir).toBe(YEAR_1);
    expect(NaturalDate.END_OF_ARTIFICIAL_TIME).toBe(YEAR_1);
  });

  // Years 2 to 30, each starting where the previous one ends
  const years: NaturalDate[] = [];
  for (let start = YEAR_1; years.length < 30; start += years[years.length - 1].yearDuration * DAY) {
    years.push(new NaturalDate(start, 180));
  }

  test('a year lasts 365 or 366 days and the next one starts where it ends', () => {
    years.forEach((y, i) => {
      expect([365, 366]).toContain(y.yearDuration);
      expect(y.year).toBe(i + 1);
      expect(y.dayOfYear).toBe(1);
    });
    expect(new Set(years.map((y) => y.yearDuration))).toEqual(new Set([365, 366]));
  });

  test.each([365, 366])('a %d-day year is 13 moons of 28 days then Rainbow day(s)', (duration) => {
    const first = years.find((y) => y.yearDuration === duration)!;
    for (let k = 0; k < duration; k++) {
      const day = new NaturalDate(first.yearStart + k * DAY + 1, 180);
      expect(day.dayOfYear).toBe(k + 1);
      expect(day.isRainbowDay).toBe(k >= 13 * 28);
      expect(day.moon).toBe(Math.min(Math.floor(k / 28) + 1, 14));
      if (k < 13 * 28) {
        expect(day.dayOfMoon).toBe(k % 28 + 1);
        expect(day.toDateString()).toBe(`${first.toYearString()})${day.toMoonString()})${day.toDayOfMoonString()}`);
      }
    }
    const lastDay = new NaturalDate(first.yearStart + duration * DAY - 1, 180);
    expect(lastDay.dayOfYear).toBe(duration);
    expect(lastDay.toDateString()).toBe(`${first.toYearString()})RAINBOW${duration === 366 ? '+' : ''}`);
    const next = new NaturalDate(first.yearStart + duration * DAY, 180);
    expect([next.year, next.dayOfYear]).toEqual([first.year + 1, 1]);
  });
});
