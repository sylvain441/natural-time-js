/**
 * Golden vectors guard: the library must still answer every recorded case,
 * within the tolerances the file announces, like natural-time-c and natural-time-py.
 * Not bit for bit: Math.sin and friends differ in the last bit from one V8 or OS to another.
 * Nobody changes its answers without regenerating the file on purpose
 * (npm run build && npm run vectors).
 */

import fs from 'node:fs';
import path from 'node:path';
import {
  NaturalDate,
  NaturalSunPosition,
  NaturalSunEvents,
  NaturalMoonPosition,
  NaturalMoonEvents,
  MustachesRange,
  resetCaches
} from '../src/index';

type Vector = Record<string, unknown>;

// Jest runs from the repository root
const FILE = path.join(process.cwd(), 'vectors', 'natural-time-vectors.jsonl');
const lines = fs.readFileSync(FILE, 'utf8').split('\n').filter((line) => line.length > 0);
const { meta } = JSON.parse(lines[0]);

// Float fields get their announced tolerance, everything else must be equal
function tolerance(field: string): number {
  if (field === 'time_deg' || field === 'effective_longitude') return meta.tolerances[field];
  if (meta.event_deg.includes(field)) return meta.tolerances.event_deg;
  if (meta.angle_deg.includes(field)) return meta.tolerances.angle_deg;
  return 0;
}

function same(field: string, want: unknown, got: unknown): boolean {
  // Not Object.is: JSON writes -0 as 0, and a longitude cut from -0.7 is -0
  if (want === got) return true;
  return typeof want === 'number' && typeof got === 'number' && Math.abs(want - got) <= tolerance(field);
}

// Mirrors vectors/generate.mjs, field by field
function compute(c: Vector): Vector {
  const precision = c.precision === 'exact' ? Infinity : (c.precision as number);
  // Cold caches, as when the vectors were written: with warm ones the last digit of a
  // sun position can differ (some call history is kept below the library)
  resetCaches();
  const nd = new NaturalDate(c.unix_ms as number, c.longitude as number, precision);
  const out: Vector = {
    unix_ms: c.unix_ms,
    longitude: c.longitude,
    precision: c.precision,
    latitude: c.latitude,

    year: nd.year,
    moon: nd.moon,
    week: nd.week,
    week_of_moon: nd.weekOfMoon,
    day: nd.day,
    day_of_year: nd.dayOfYear,
    day_of_moon: nd.dayOfMoon,
    day_of_week: nd.dayOfWeek,
    is_rainbow_day: nd.isRainbowDay,
    time_deg: nd.time,
    year_start: nd.yearStart,
    year_duration: nd.yearDuration,
    nadir: nd.nadir,
    effective_longitude: nd.effectiveLongitude,

    date_string: nd.toDateString(),
    time_string: nd.toTimeString(),
    time_string_whole: nd.toTimeString(0),
    longitude_string: nd.toLongitudeString(),
    longitude_string_2: nd.toLongitudeString(2),
    string: nd.toString()
  };

  const latitude = c.latitude as number | null;
  if (latitude !== null) {
    const sp = NaturalSunPosition(nd, latitude);
    const se = NaturalSunEvents(nd, latitude);
    const mp = NaturalMoonPosition(nd, latitude);
    const me = NaturalMoonEvents(nd, latitude);
    const mu = MustachesRange(nd, latitude);
    Object.assign(out, {
      sun_azimuth: sp.azimuth,
      sun_elevation: sp.elevation,
      sun_altitude: sp.altitude,
      sun_highest_altitude: sp.highestAltitude,
      sun_is_above_horizon: sp.isAboveHorizon,

      sunrise_deg: se.sunrise,
      sunset_deg: se.sunset,
      night_start_deg: se.nightStart,
      night_end_deg: se.nightEnd,
      morning_golden_deg: se.morningGoldenHour,
      evening_golden_deg: se.eveningGoldenHour,

      moon_altitude: mp.altitude,
      moon_phase_deg: mp.phase,
      moonrise_deg: me.moonrise,
      moonset_deg: me.moonset,
      moon_highest_altitude: me.highestAltitude,

      mustache_winter_sunrise_deg: mu.winterSunrise,
      mustache_winter_sunset_deg: mu.winterSunset,
      mustache_summer_sunrise_deg: mu.summerSunrise,
      mustache_summer_sunset_deg: mu.summerSunset,
      mustache_angle_deg: mu.averageMustacheAngle
    });
  }
  return out;
}

describe('Golden vectors', () => {
  test('meta line matches the number of cases', () => {
    expect(meta.cases).toBe(lines.length - 1);
  });

  test('every case is answered as recorded', () => {
    const mismatches: string[] = [];

    for (let i = 1; i < lines.length; i++) {
      const expected: Vector = JSON.parse(lines[i]);
      const received = compute(expected);

      for (const field of new Set([...Object.keys(expected), ...Object.keys(received)])) {
        if (!same(field, expected[field], received[field])) {
          mismatches.push(
            `line ${i + 1}, field ${field}: expected ${JSON.stringify(expected[field])}, received ${JSON.stringify(received[field])}`
            + ` (unix_ms=${expected.unix_ms} longitude=${expected.longitude} precision=${expected.precision} latitude=${expected.latitude})`
          );
        }
      }
    }

    // Report the first mismatches only: one regression usually breaks many lines
    expect(mismatches.slice(0, 20).join('\n') + (mismatches.length > 20 ? `\n... ${mismatches.length} in total` : '')).toBe('');
  }, 60000);
});
