#!/usr/bin/env node
// Golden vectors: what natural-time-js answers, written down so that every other
// implementation (C, Python, the next one) can be checked against it.
//
//   npm run vectors
//
// Output: vectors/natural-time-vectors.jsonl. Line 1 is {"meta": ...}, then one
// flat JSON object per line, one line per case. Deterministic: same code, same file.
// Copies live in natural-time-c and natural-time-py (tests/data/); they must be
// byte-identical to this one.

import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { Seasons } from 'astronomy-engine';
import {
  NaturalDate, NaturalSunPosition, NaturalSunEvents, NaturalMoonPosition,
  NaturalMoonEvents, MustachesRange, resetCaches
} from '../dist/index.js';

const require = createRequire(import.meta.url);
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(repoRoot, 'vectors', 'natural-time-vectors.jsonl');
const DAY = NaturalDate.MILLISECONDS_PER_DAY;
const EXACT = Infinity;

// Places that stretch the sky: both poles, both polar circles, both tropics,
// the equator, and a few places where people actually live.
const LATITUDES = [-90, -77.85, -66.6, -45, -33.87, -23.44, 0, 23.44, 46, 48.8566, 60, 66.6, 69.65, 78.22, 90];

const cases = [];
const seen = new Set();

function add(unixMs, longitude, precision, latitude) {
  const key = `${unixMs}|${longitude}|${precision}|${latitude}`;
  if (seen.has(key)) return;
  seen.add(key);

  resetCaches(); // every case answers for itself
  const nd = new NaturalDate(unixMs, longitude, precision);
  const c = {
    unix_ms: unixMs,
    longitude,
    precision: precision === EXACT ? 'exact' : precision,
    latitude,

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

  if (latitude !== null) {
    const sp = NaturalSunPosition(nd, latitude);
    const se = NaturalSunEvents(nd, latitude);
    const mp = NaturalMoonPosition(nd, latitude);
    const me = NaturalMoonEvents(nd, latitude);
    const mu = MustachesRange(nd, latitude);
    Object.assign(c, {
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
  cases.push(c);
}

const lat = (i) => LATITUDES[i % LATITUDES.length];

// 1. Where years meet: the last moon, the Rainbow day(s), the first instant of
//    the next year, at the meridian, at both sides of the date line and in between.
{
  // One 365-day year, the first 366-day years we can find, year 0 and year 1.
  const years = new Set([2011, 2012, 2025]);
  for (let y = 2013; y < 2040 && years.size < 5; y++) {
    if (new NaturalDate(Date.UTC(y + 1, 5, 1), 0).yearDuration === 366) years.add(y);
  }
  let i = 0;
  for (const y of years) {
    for (const longitude of [-180, -73.57, 0, 2.3522, 179.9, 180]) {
      for (const precision of [0, EXACT]) {
        const { yearStart: ys, yearDuration: dur } = new NaturalDate(Date.UTC(y + 1, 5, 1), longitude, precision);
        for (const t of [ys - 1, ys, ys + 1, ys + 363 * DAY + 12345678, ys + 364 * DAY, ys + 365 * DAY - 1, ys + 365 * DAY, ys + dur * DAY - 1]) {
          add(t, longitude, precision, lat(i++));
        }
      }
    }
  }
}

// 2. One turn of the dial, and the instants where rounding likes to trip.
{
  const nadir = new NaturalDate(Date.UTC(2026, 3, 23, 12), 2.3522, EXACT).nadir;
  for (let k = 0; k < 40; k++) add(nadir + k * 2222222 + 777, 2.3522, EXACT, 46);
  for (const ms of [0, 1, 1199, 1200, 239999, 240000, 48719999, 48720000, 43200000, DAY - 1200, DAY - 1199, DAY - 1]) {
    add(nadir + ms, 2.3522, EXACT, 46);
  }
}

// 3. Longitudes and precisions: where the label must say what the clock does.
{
  const longitudes = [-180, -179.99, -179.9, -150.5, -100.29, -73.57, -1.15, -1, -0.999, -0.7, -0.29, -0.04,
    0, 0.04, 0.29, 0.5, 0.99, 1, 1.15, 2.3522, 2.96, 2.999, 5.12345, 45, 100.29, 179.9, 179.999, 180];
  let i = 0;
  for (const t of [Date.UTC(2026, 3, 23, 14, 56), 1790000000123]) {
    for (const longitude of longitudes) {
      for (const precision of [0, 1, 2, EXACT]) add(t, longitude, precision, lat(i++));
    }
  }
}

// 4. The sky itself: solstices, equinoxes and ordinary days, from pole to pole.
{
  const s = Seasons(2026);
  const moments = [
    s.mar_equinox.date.getTime(), s.jun_solstice.date.getTime(),
    s.sep_equinox.date.getTime(), s.dec_solstice.date.getTime(),
    Date.UTC(2026, 0, 1, 0, 30), Date.UTC(2026, 1, 14, 5, 17, 3, 141),
    Date.UTC(2026, 7, 12, 17, 46), Date.UTC(2026, 10, 13, 20, 0)
  ];
  for (const t of moments) {
    for (const latitude of LATITUDES) {
      add(t, 2.3522, EXACT, latitude);
      add(t, -122.4194, 0, latitude);
      add(t, 151.2093, EXACT, latitude);
    }
  }
}

// 5. Far from now, both ways.
{
  let i = 0;
  for (const t of [Date.UTC(1975, 4, 17, 3), Date.UTC(1999, 11, 31, 23, 59, 59, 999), Date.UTC(2100, 1, 28, 12), Date.UTC(2500, 8, 9, 9, 9), Date.UTC(3000, 0, 1)]) {
    for (const longitude of [0, 2.3522, -157.86, 179.9]) add(t, longitude, i % 2 ? EXACT : 0, lat(i++ * 4));
  }
  for (const t of [0, Date.UTC(1970, 5, 1), Date.UTC(1969, 6, 20, 20, 17), Date.UTC(1900, 0, 1), Date.UTC(1000, 5, 15, 6), Date.UTC(200, 2, 1)]) {
    for (const longitude of [0, -73.57, 180]) add(t, longitude, i % 2 ? EXACT : 0, lat(i++ * 4));
  }
}

const meta = {
  format: 1,
  specification: 'natural time v1.1',
  reference: `natural-time-js ${require('../package.json').version}`,
  astronomy_engine: JSON.parse(await fs.readFile(path.join(repoRoot, 'node_modules/astronomy-engine/package.json'), 'utf8')).version,
  cases: cases.length,
  precision: 'longitude decimals used by the calendar and the time; "exact" keeps the longitude as given',
  tolerances: {
    integers_booleans_strings: 'exact',
    time_deg: 1e-9,
    effective_longitude: 1e-12,
    // The engine stops its searches within 0.1 s (4.2e-4°): two math libraries may stop one step apart
    event_deg: 5e-4,
    angle_deg: 1e-6
  },
  event_deg: ['sunrise_deg', 'sunset_deg', 'night_start_deg', 'night_end_deg', 'morning_golden_deg', 'evening_golden_deg',
    'moonrise_deg', 'moonset_deg', 'mustache_winter_sunrise_deg', 'mustache_winter_sunset_deg',
    'mustache_summer_sunrise_deg', 'mustache_summer_sunset_deg', 'mustache_angle_deg'],
  angle_deg: ['sun_azimuth', 'sun_elevation', 'sun_altitude', 'sun_highest_altitude',
    'moon_altitude', 'moon_phase_deg', 'moon_highest_altitude']
};

await fs.mkdir(path.dirname(OUT), { recursive: true });
await fs.writeFile(OUT, [JSON.stringify({ meta }), ...cases.map((c) => JSON.stringify(c))].join('\n') + '\n', 'utf8');
console.log(`${cases.length} cases written to ${path.relative(repoRoot, OUT)}`);
