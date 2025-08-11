#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { NaturalDate, NaturalSunEvents, NaturalSunAltitude, NaturalMoonPosition, NaturalMoonEvents, MustachesRange } from '../dist/index.js';
import { Seasons } from 'astronomy-engine';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Hard-coded configuration per requirements
const YEARS = (() => {
  const out = [];
  for (let y = -5000; y <= 5000; y += 100) out.push(y);
  return out;
})();
const LATITUDES = [-90, -80, -70, -60, -45, -30, -15, 0, 15, 30, 45, 60, 70, 80, 90];
const LONGITUDES = [-180, -120, -60, -30, 0, 30, 60, 120, 180];
const RANDOM_PER_YEAR = 2;

// No CLI parameters; everything is hard-coded

function parseNumberList(spec, fallback) {
  if (!spec) return fallback;
  return spec.split(',').map(s => Number(s.trim())).filter(n => Number.isFinite(n));
}

function toSnake(obj) {
  const mapKey = (k) => k
    .replace(/([A-Z])/g, '_$1')
    .replace(/__/g, '_')
    .toLowerCase();
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    out[mapKey(k)] = v;
  }
  return out;
}

function naturalDateToExpected(nd) {
  return {
    year: nd.year,
    moon: nd.moon,
    week: nd.week,
    week_of_moon: nd.weekOfMoon,
    unix_time: nd.unixTime,
    year_start: nd.yearStart,
    nadir: nd.nadir,
    day: nd.day,
    day_of_year: nd.dayOfYear,
    day_of_moon: nd.dayOfMoon,
    day_of_week: nd.dayOfWeek,
    year_duration: nd.yearDuration,
    is_rainbow_day: nd.isRainbowDay,
    longitude: nd.longitude,
    time_deg: nd.time
  };
}

function sunEventsToExpected(events) {
  return {
    sunrise_deg: events.sunrise,
    sunset_deg: events.sunset,
    night_start_deg: events.nightStart,
    night_end_deg: events.nightEnd,
    morning_golden_deg: events.morningGoldenHour,
    evening_golden_deg: events.eveningGoldenHour
  };
}

function sunAltitudeToExpected(sa) {
  return {
    sun_altitude: sa.altitude
  };
}

function moonPositionToExpected(mp) {
  return {
    altitude: mp.altitude,
    phase_deg: mp.phase,
  };
}

function moonEventsToExpected(me) {
  return {
    moonrise_deg: me.moonrise,
    moonset_deg: me.moonset,
    highest_altitude: me.highestAltitude
  };
}

function mustachesToExpected(m) {
  return {
    winter_sunrise_deg: m.winterSunrise,
    winter_sunset_deg: m.winterSunset,
    summer_sunrise_deg: m.summerSunrise,
    summer_sunset_deg: m.summerSunset,
    average_angle_deg: m.averageMustacheAngle
  };
}

async function ensureDir(filePath) {
  const dir = path.dirname(filePath);
  await fs.mkdir(dir, { recursive: true });
}

function buildSampleTimestampsForYear(year) {
  // Use precise astronomical events and a few offsets around solstices
  try {
    const s = Seasons(year);
    const dates = [
      s.mar_equinox.date,
      s.jun_solstice.date,
      s.sep_equinox.date,
      s.dec_solstice.date
    ];
    const ms = [];
    for (const d of dates) {
      const t = d.getTime();
      // exact event, and +/- 2 days at 12:00 UTC
      ms.push(t);
      ms.push(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - 2, 12, 0, 0));
      ms.push(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 2, 12, 0, 0));
    }
    // Deduplicate and sort
    return Array.from(new Set(ms)).sort((a, b) => a - b);
  } catch {
    return [];
  }
}

function mulberry32(seed) {
  let t = seed >>> 0;
  return function() {
    t += 0x6D2B79F5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function computeYearStartUTC(year) {
  const startSolstice = Seasons(year).dec_solstice.date;
  const startNewYear = Date.UTC(
    startSolstice.getUTCFullYear(),
    startSolstice.getUTCMonth(),
    startSolstice.getUTCDate() + (startSolstice.getUTCHours() >= 12 ? 1 : 0),
    12, 0, 0
  );
  return startNewYear;
}

function computeYearEndUTC(year) {
  const endSolstice = Seasons(year + 1).dec_solstice.date;
  const endNewYear = Date.UTC(
    endSolstice.getUTCFullYear(),
    endSolstice.getUTCMonth(),
    endSolstice.getUTCDate() + (endSolstice.getUTCHours() >= 12 ? 1 : 0),
    12, 0, 0
  );
  return endNewYear;
}

async function main() {
  const repoRoot = path.resolve(__dirname, '..');
  const outPath = path.resolve(repoRoot, 'vectors', 'vectors.json');

  const meta = {
    generated_at: new Date().toISOString(),
    library: 'natural-time-js',
    centuries: '-5000:5000',
    random_per_year: RANDOM_PER_YEAR,
    latitudes: LATITUDES,
    longitudes: LONGITUDES
  };

  const cases = [];

  for (const year of YEARS) {
    const timestamps = buildSampleTimestampsForYear(year);
    if (timestamps.length === 0) continue; // unsupported year by astronomy-engine
    // Add deterministic random samples inside the natural year range
    const yearStart = computeYearStartUTC(year);
    const yearEnd = computeYearEndUTC(year);
    const rnd = mulberry32(year ^ 0x9e3779b9);
    for (let i = 0; i < RANDOM_PER_YEAR; i++) {
      const u = rnd();
      const t = Math.floor(yearStart + u * (yearEnd - yearStart));
      timestamps.push(t);
    }
    // Deduplicate again after adding randoms
    const uniqueTimestamps = Array.from(new Set(timestamps)).sort((a, b) => a - b);
    for (const unix_ms_utc of uniqueTimestamps) {
      for (const longitude of LONGITUDES) {
        for (const latitude of LATITUDES) {
          try {
          const nd = new NaturalDate(unix_ms_utc, longitude);
          const sun = NaturalSunEvents(nd, latitude);
          const sunAlt = NaturalSunAltitude(nd, latitude);
          const mp = NaturalMoonPosition(nd, latitude);
          const me = NaturalMoonEvents(nd, latitude);
          const must = MustachesRange(nd, latitude);
            cases.push({
              unix_ms_utc,
              longitude,
              latitude,
              expect: {
                ...naturalDateToExpected(nd),
              ...sunEventsToExpected(sun),
              ...sunAltitudeToExpected(sunAlt),
              ...moonPositionToExpected(mp),
              ...moonEventsToExpected(me),
              ...mustachesToExpected(must)
              }
            });
          } catch {
            // Skip invalid combination
          }
        }
      }
    }
  }

  const payload = { meta, cases };
  await ensureDir(outPath);
  await fs.writeFile(outPath, JSON.stringify(payload, null, 2), 'utf8');
  // eslint-disable-next-line no-console
  console.log(`Golden vectors written to ${outPath} (${cases.length} cases).`);
}

main().catch(err => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});


