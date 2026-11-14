/**
 * What the golden vectors cannot say: argument validation, how the functions relate
 * to each other, and what precision does and does not change in the sky.
 */

import {
  NaturalDate,
  NaturalSunPosition,
  NaturalSunAltitude,
  NaturalSunEvents,
  NaturalMoonPosition,
  NaturalMoonEvents,
  MustachesRange,
} from '../src/index';

const PARIS = 48.8566;
const instant = Date.UTC(2026, 3, 23, 14, 56);

const SKY = {
  NaturalSunPosition, NaturalSunAltitude, NaturalSunEvents,
  NaturalMoonPosition, NaturalMoonEvents, MustachesRange,
};

describe.each(Object.entries(SKY))('%s refuses wrong arguments', (_, sky) => {
  const date = new NaturalDate(instant, 2.3522);

  test.each([null, undefined, {}, instant, new Date(instant)])('a %p is not a NaturalDate', (notADate) => {
    expect(() => sky(notADate as any, PARIS)).toThrow('Invalid naturalDate');
  });

  test.each([-91, 91, NaN, Infinity, '45' as any, null as any, undefined as any])('latitude %p', (latitude) => {
    expect(() => sky(date, latitude)).toThrow('Invalid latitude');
  });

  test('the poles are valid latitudes', () => {
    expect(() => sky(date, 90)).not.toThrow();
    expect(() => sky(date, -90)).not.toThrow();
  });
});

describe('sun position', () => {
  test('altitude is the elevation clamped to the horizon, by day and by night', () => {
    const day = NaturalSunPosition(new NaturalDate('2024-06-01T12:00:00Z', 2.3522, Infinity), PARIS);
    expect(day.elevation).toBeGreaterThan(0);
    expect(day.altitude).toBe(day.elevation);
    expect(day.isAboveHorizon).toBe(true);

    const night = NaturalSunPosition(new NaturalDate('2024-06-01T00:00:00Z', 2.3522, Infinity), PARIS);
    expect(night.elevation).toBeLessThan(0);
    expect(night.altitude).toBe(0);
    expect(night.isAboveHorizon).toBe(false);
  });

  test('NaturalSunAltitude is the altitude pair of NaturalSunPosition', () => {
    const date = new NaturalDate(instant, 2.3522, Infinity);
    const { altitude, highestAltitude } = NaturalSunPosition(date, PARIS);
    expect(NaturalSunAltitude(date, PARIS)).toEqual({ altitude, highestAltitude });
  });
});

describe('precision shapes the clock, not the Earth', () => {
  const zone = new NaturalDate(instant, 2.9, 0);
  const exact = new NaturalDate(instant, 2.9, Infinity);

  test('positions are those of the longitude as given', () => {
    // highestAltitude is read on the day, which starts on a different midnight
    const { azimuth, elevation } = NaturalSunPosition(exact, 45);
    expect(NaturalSunPosition(zone, 45)).toMatchObject({ azimuth, elevation });
    expect(NaturalMoonPosition(zone, 45)).toEqual(NaturalMoonPosition(exact, 45));
  });

  test('events are the same crossings, read from a midnight 0.9° earlier on the exact clock', () => {
    const a = NaturalSunEvents(zone, 45);
    const b = NaturalSunEvents(exact, 45);
    for (const key of ['sunrise', 'sunset', 'nightStart', 'nightEnd'] as const) {
      expect(b[key] - a[key]).toBeCloseTo(0.9, 2);
    }
  });
});

describe('mustaches', () => {
  test('one answer for the whole UTC year, wherever and whenever in it', () => {
    const newYearsMorning = MustachesRange(new NaturalDate('2026-01-01T00:30:00Z', 0), 46);
    expect(MustachesRange(new NaturalDate('2026-06-01T12:00:00Z', 0), 46)).toEqual(newYearsMorning);
    expect(MustachesRange(new NaturalDate('2026-12-31T23:30:00Z', -150, Infinity), 46)).toEqual(newYearsMorning);
    expect(MustachesRange(new NaturalDate('2027-06-01T12:00:00Z', 0), 46)).not.toEqual(newYearsMorning);
  });

  test('the average angle swings from 0 to 90, mirrored between hemispheres', () => {
    const date = new NaturalDate(instant, 0);
    const north = MustachesRange(date, 46).averageMustacheAngle;
    expect(north).toBeGreaterThan(0);
    expect(north).toBeLessThanOrEqual(90);
    expect(MustachesRange(date, -46).averageMustacheAngle).toBeCloseTo(north, 0);
    expect(MustachesRange(date, 0).averageMustacheAngle).toBeLessThan(north);
  });
});
