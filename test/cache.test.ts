/**
 * The cache must be invisible: a hit returns what a fresh computation would, any
 * change of key misses, and beyond 512 entries the oldest is forgotten and recomputed.
 */

import { Seasons } from 'astronomy-engine';
import {
  NaturalDate,
  NaturalSunEvents,
  NaturalMoonEvents,
  MustachesRange,
  resetCaches,
} from '../src/index';

// A year context miss asks astronomy-engine for two solstices: counting those calls shows it
jest.mock('astronomy-engine', () => {
  const actual = jest.requireActual('astronomy-engine');
  return { ...actual, Seasons: jest.fn(actual.Seasons) };
});
const seasonsCalls = Seasons as unknown as jest.Mock;

const T = Date.UTC(2026, 3, 23, 14, 56);
const DAY = 86400000;
const LAT = 48.8566;
const LON = 2.3522;
const BOUND = 512;

const fresh = <R>(compute: () => R): R => {
  resetCaches();
  return compute();
};

type Inputs = { date: NaturalDate; latitude: number };
const base = (): Inputs => ({ date: new NaturalDate(T, LON, 0), latitude: LAT });

// `moves`, in the order of CHANGES: whether changing that one input must change the answer.
// Mustaches are read from the meridian for the UTC year: only latitude enters.
const SKIES = [
  { name: 'sun events', of: NaturalSunEvents, moves: [true, true, true, true] },
  { name: 'moon events', of: NaturalMoonEvents, moves: [true, true, true, true] },
  { name: 'mustaches', of: MustachesRange, moves: [true, false, false, false] },
];
const CHANGES: [string, () => Inputs][] = [
  ['latitude', () => ({ date: new NaturalDate(T, LON, 0), latitude: LAT - 10 })],
  ['longitude', () => ({ date: new NaturalDate(T, LON + 30, 0), latitude: LAT })],
  ['precision', () => ({ date: new NaturalDate(T, LON, Infinity), latitude: LAT })],
  ['next day', () => ({ date: new NaturalDate(T + DAY, LON, 0), latitude: LAT })],
];

describe.each(SKIES)('$name', ({ of, moves }) => {
  const run = ({ date, latitude }: Inputs) => of(date, latitude);

  test('a repeated call returns the very same object', () => {
    resetCaches();
    const { date, latitude } = base();
    expect(of(date, latitude)).toBe(of(date, latitude));
  });

  test.each(CHANGES.map(([change, make], i) => [change, make, moves[i]] as const))(
    'changing only the %s gives the fresh answer, and back gives the first', (_, make, moved) => {
      const expected = fresh(() => run(make()));

      resetCaches();
      const first = run(base());
      const other = run(make());

      expect(other).toEqual(expected);
      if (moved) expect(other).not.toEqual(first);
      else expect(other).toEqual(first);
      expect(run(base())).toEqual(first);
    });
});

describe('year context', () => {
  test.each([
    ['longitude', () => new NaturalDate(T, LON + 30, 0)],
    ['precision', () => new NaturalDate(T, LON, Infinity)],
    ['year', () => new NaturalDate(Date.UTC(2027, 5, 1), LON, 0)],
  ])('changing only the %s gives the fresh date, and back gives the first', (_, make) => {
    const expected = fresh(() => ({ ...make() }));

    resetCaches();
    const first = { ...new NaturalDate(T, LON, 0) };
    expect({ ...make() }).toEqual(expected);
    expect({ ...make() }).not.toEqual(first);
    expect({ ...new NaturalDate(T, LON, 0) }).toEqual(first);
  });
});

describe('resetCaches', () => {
  test('empties the cache: the next answer is a new object, equal to the old one', () => {
    const { date, latitude } = base();
    const before = NaturalSunEvents(date, latitude);
    resetCaches();
    const after = NaturalSunEvents(date, latitude);
    expect(after).not.toBe(before);
    expect(after).toEqual(before);
  });
});

describe(`the shared cache holds ${BOUND} entries`, () => {
  // An exact longitude is its own year context entry, with no sky search behind it
  const exact = (i: number) => new NaturalDate(T, -179 + i * 0.01, Infinity);

  test('beyond them the oldest is forgotten and recomputed, equal to before', () => {
    resetCaches();
    const first = { ...exact(0) };
    for (let i = 1; i < BOUND; i++) exact(i);

    // Full, nothing forgotten: a hit never asks for the solstices
    seasonsCalls.mockClear();
    exact(0);
    exact(BOUND - 1);
    expect(seasonsCalls).not.toHaveBeenCalled();

    // One more entry: the oldest goes, the next oldest stays
    exact(BOUND);
    seasonsCalls.mockClear();
    exact(1);
    expect(seasonsCalls).not.toHaveBeenCalled();
    expect({ ...exact(0) }).toEqual(first);
    expect(seasonsCalls).toHaveBeenCalledTimes(2);
  });

  test('sun events, moon events and mustaches are forgotten alike, and answer the same again', () => {
    const skies = [NaturalSunEvents, NaturalMoonEvents, MustachesRange];
    resetCaches();
    const { date, latitude } = base();
    const kept = skies.map((of) => of(date, latitude));
    skies.forEach((of, i) => expect(of(date, latitude)).toBe(kept[i]));

    for (let i = 0; i < BOUND + 10; i++) exact(i);

    skies.forEach((of, i) => {
      const again = of(date, latitude);
      expect(again).not.toBe(kept[i]);
      expect(again).toEqual(kept[i]);
    });
  });
});
