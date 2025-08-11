/**
 * Test suite for natural-time-js context functionality
 * Tests astronomical calculations and events
 * 
 * Natural time is based on astronomical reality:
 * - 0° represents mid-night (nadir) at the specific longitude
 * - 180° represents mid-day (zenith) at the specific longitude
 * - Time is calculated directly from astronomical position, not converted from conventional time
 */

import { 
  NaturalDate,
  NaturalSunAltitude, 
  NaturalSunEvents, 
  NaturalMoonPosition, 
  NaturalMoonEvents,
  MustachesRange,
} from '../../index';

// Test constants
interface Location {
  latitude: number;
  longitude: number;
}

const EQUATOR: Location = { latitude: 0, longitude: 0 };
const PARIS: Location = { latitude: 48.8566, longitude: 2.3522 };
const SYDNEY: Location = { latitude: -33.8688, longitude: 151.2093 };

describe('Celestial Functions', () => {
  describe('1. Sun Altitude', () => {
    test('should calculate sun altitude at equator', () => {
      const date = new NaturalDate(new Date(), EQUATOR.longitude);
      const sunAltitude = NaturalSunAltitude(date, EQUATOR.latitude);
      
      expect(typeof sunAltitude.altitude).toBe('number');
      expect(typeof sunAltitude.highestAltitude).toBe('number');
      
      expect(sunAltitude.altitude).toBeGreaterThanOrEqual(0);
      expect(sunAltitude.altitude).toBeLessThanOrEqual(90);
      
      expect(sunAltitude.highestAltitude).toBeGreaterThanOrEqual(0);
      expect(sunAltitude.highestAltitude).toBeLessThanOrEqual(90);
    });

    test('should calculate sun altitude in Paris', () => {
      const date = new NaturalDate(new Date(), PARIS.longitude);
      const sunAltitude = NaturalSunAltitude(date, PARIS.latitude);
      
      expect(typeof sunAltitude.altitude).toBe('number');
      expect(typeof sunAltitude.highestAltitude).toBe('number');
      
      expect(sunAltitude.altitude).toBeGreaterThanOrEqual(0);
      expect(sunAltitude.altitude).toBeLessThanOrEqual(90);
      
      expect(sunAltitude.highestAltitude).toBeGreaterThanOrEqual(0);
      expect(sunAltitude.highestAltitude).toBeLessThanOrEqual(90);
    });
  });

  describe('2. Sun Events', () => {
    test('should calculate sun events at equator', () => {
      const date = new NaturalDate(new Date(), EQUATOR.longitude);
      const sunEvents = NaturalSunEvents(date, EQUATOR.latitude);
      
      expect(typeof sunEvents.sunrise).toBe('number');
      expect(typeof sunEvents.sunset).toBe('number');
      expect(typeof sunEvents.nightStart).toBe('number');
      expect(typeof sunEvents.nightEnd).toBe('number');
      expect(typeof sunEvents.morningGoldenHour).toBe('number');
      expect(typeof sunEvents.eveningGoldenHour).toBe('number');
      
      expect(sunEvents.sunrise).toBeGreaterThanOrEqual(0);
      expect(sunEvents.sunrise).toBeLessThanOrEqual(360);
      
      expect(sunEvents.sunset).toBeGreaterThanOrEqual(0);
      expect(sunEvents.sunset).toBeLessThanOrEqual(360);
      
      expect(sunEvents.nightStart).toBeGreaterThanOrEqual(0);
      expect(sunEvents.nightStart).toBeLessThanOrEqual(360);
      
      expect(sunEvents.nightEnd).toBeGreaterThanOrEqual(0);
      expect(sunEvents.nightEnd).toBeLessThanOrEqual(360);
      
      expect(sunEvents.morningGoldenHour).toBeGreaterThanOrEqual(0);
      expect(sunEvents.morningGoldenHour).toBeLessThanOrEqual(360);
      
      expect(sunEvents.eveningGoldenHour).toBeGreaterThanOrEqual(0);
      expect(sunEvents.eveningGoldenHour).toBeLessThanOrEqual(360);
    });

    test('should calculate sun events in Paris', () => {
      const date = new NaturalDate(new Date(), PARIS.longitude);
      const sunEvents = NaturalSunEvents(date, PARIS.latitude);
      
      expect(typeof sunEvents.sunrise).toBe('number');
      expect(typeof sunEvents.sunset).toBe('number');
      expect(typeof sunEvents.nightStart).toBe('number');
      expect(typeof sunEvents.nightEnd).toBe('number');
      expect(typeof sunEvents.morningGoldenHour).toBe('number');
      expect(typeof sunEvents.eveningGoldenHour).toBe('number');
      
      expect(sunEvents.sunrise).toBeGreaterThanOrEqual(0);
      expect(sunEvents.sunrise).toBeLessThanOrEqual(360);
      
      expect(sunEvents.sunset).toBeGreaterThanOrEqual(0);
      expect(sunEvents.sunset).toBeLessThanOrEqual(360);
      
      expect(sunEvents.nightStart).toBeGreaterThanOrEqual(0);
      expect(sunEvents.nightStart).toBeLessThanOrEqual(360);
      
      expect(sunEvents.nightEnd).toBeGreaterThanOrEqual(0);
      expect(sunEvents.nightEnd).toBeLessThanOrEqual(360);
      
      expect(sunEvents.morningGoldenHour).toBeGreaterThanOrEqual(0);
      expect(sunEvents.morningGoldenHour).toBeLessThanOrEqual(360);
      
      expect(sunEvents.eveningGoldenHour).toBeGreaterThanOrEqual(0);
      expect(sunEvents.eveningGoldenHour).toBeLessThanOrEqual(360);
    });
  });

  describe('3. Moon Position', () => {
    test('should calculate moon position at equator', () => {
      const date = new NaturalDate(new Date(), EQUATOR.longitude);
      const moonPosition = NaturalMoonPosition(date, EQUATOR.latitude);
      
      expect(typeof moonPosition.altitude).toBe('number');
      expect(typeof moonPosition.phase).toBe('number');
      
      expect(moonPosition.altitude).toBeGreaterThanOrEqual(0);
      expect(moonPosition.altitude).toBeLessThanOrEqual(90);
      
      expect(moonPosition.phase).toBeGreaterThanOrEqual(0);
      expect(moonPosition.phase).toBeLessThanOrEqual(360);
    });

    test('should calculate moon position in Paris', () => {
      const date = new NaturalDate(new Date(), PARIS.longitude);
      const moonPosition = NaturalMoonPosition(date, PARIS.latitude);
      
      expect(typeof moonPosition.altitude).toBe('number');
      expect(typeof moonPosition.phase).toBe('number');
      
      expect(moonPosition.altitude).toBeGreaterThanOrEqual(0);
      expect(moonPosition.altitude).toBeLessThanOrEqual(90);
      
      expect(moonPosition.phase).toBeGreaterThanOrEqual(0);
      expect(moonPosition.phase).toBeLessThanOrEqual(360);
    });
  });

  describe('4. Moon Events', () => {
    test('should calculate moon events at equator', () => {
      const date = new NaturalDate(new Date(), EQUATOR.longitude);
      const moonEvents = NaturalMoonEvents(date, EQUATOR.latitude);
      
      expect(typeof moonEvents.moonrise).toBe('number');
      expect(typeof moonEvents.moonset).toBe('number');
      expect(typeof moonEvents.highestAltitude).toBe('number');
      
      if (moonEvents.moonrise !== 0) {
        expect(moonEvents.moonrise).toBeGreaterThanOrEqual(0);
        expect(moonEvents.moonrise).toBeLessThanOrEqual(360);
      }
      
      if (moonEvents.moonset !== 0) {
        expect(moonEvents.moonset).toBeGreaterThanOrEqual(0);
        expect(moonEvents.moonset).toBeLessThanOrEqual(360);
      }
      
      expect(moonEvents.highestAltitude).toBeGreaterThanOrEqual(0);
      expect(moonEvents.highestAltitude).toBeLessThanOrEqual(90);
    });

    test('should calculate moon events in Paris', () => {
      const date = new NaturalDate(new Date(), PARIS.longitude);
      const moonEvents = NaturalMoonEvents(date, PARIS.latitude);
      
      expect(typeof moonEvents.moonrise).toBe('number');
      expect(typeof moonEvents.moonset).toBe('number');
      expect(typeof moonEvents.highestAltitude).toBe('number');
      
      if (moonEvents.moonrise !== 0) {
        expect(moonEvents.moonrise).toBeGreaterThanOrEqual(0);
        expect(moonEvents.moonrise).toBeLessThanOrEqual(360);
      }
      
      if (moonEvents.moonset !== 0) {
        expect(moonEvents.moonset).toBeGreaterThanOrEqual(0);
        expect(moonEvents.moonset).toBeLessThanOrEqual(360);
      }
      
      expect(moonEvents.highestAltitude).toBeGreaterThanOrEqual(0);
      expect(moonEvents.highestAltitude).toBeLessThanOrEqual(90);
    });
  });

  describe('5. Mustaches Range', () => {
    test('should calculate mustaches range at equator', () => {
      const date = new NaturalDate(new Date(), EQUATOR.longitude);
      const mustachesRange = MustachesRange(date, EQUATOR.latitude);
      
      expect(typeof mustachesRange.winterSunrise).toBe('number');
      expect(typeof mustachesRange.winterSunset).toBe('number');
      expect(typeof mustachesRange.summerSunrise).toBe('number');
      expect(typeof mustachesRange.summerSunset).toBe('number');
      expect(typeof mustachesRange.averageMustacheAngle).toBe('number');
      
      // At equator, sunrise and sunset times should be relatively consistent year-round
      expect(mustachesRange.winterSunrise).toBeGreaterThanOrEqual(0);
      expect(mustachesRange.winterSunrise).toBeLessThanOrEqual(360);
      expect(mustachesRange.winterSunset).toBeGreaterThanOrEqual(0);
      expect(mustachesRange.winterSunset).toBeLessThanOrEqual(360);
      expect(mustachesRange.summerSunrise).toBeGreaterThanOrEqual(0);
      expect(mustachesRange.summerSunrise).toBeLessThanOrEqual(360);
      expect(mustachesRange.summerSunset).toBeGreaterThanOrEqual(0);
      expect(mustachesRange.summerSunset).toBeLessThanOrEqual(360);
      
      // At equator, mustache angle should be relatively small
      expect(mustachesRange.averageMustacheAngle).toBeGreaterThanOrEqual(0);
      expect(mustachesRange.averageMustacheAngle).toBeLessThanOrEqual(30);
    });

    test('should calculate mustaches range in Paris', () => {
      const date = new NaturalDate(new Date(), PARIS.longitude);
      const mustachesRange = MustachesRange(date, PARIS.latitude);
      
      expect(typeof mustachesRange.winterSunrise).toBe('number');
      expect(typeof mustachesRange.winterSunset).toBe('number');
      expect(typeof mustachesRange.summerSunrise).toBe('number');
      expect(typeof mustachesRange.summerSunset).toBe('number');
      expect(typeof mustachesRange.averageMustacheAngle).toBe('number');
      
      // In Paris (Northern hemisphere), winter sunrise should be later and sunset earlier than summer
      expect(mustachesRange.winterSunrise).toBeGreaterThan(mustachesRange.summerSunrise);
      expect(mustachesRange.winterSunset).toBeLessThan(mustachesRange.summerSunset);
      
      // All times should be within valid range
      expect(mustachesRange.winterSunrise).toBeGreaterThanOrEqual(0);
      expect(mustachesRange.winterSunrise).toBeLessThanOrEqual(360);
      expect(mustachesRange.winterSunset).toBeGreaterThanOrEqual(0);
      expect(mustachesRange.winterSunset).toBeLessThanOrEqual(360);
      expect(mustachesRange.summerSunrise).toBeGreaterThanOrEqual(0);
      expect(mustachesRange.summerSunrise).toBeLessThanOrEqual(360);
      expect(mustachesRange.summerSunset).toBeGreaterThanOrEqual(0);
      expect(mustachesRange.summerSunset).toBeLessThanOrEqual(360);
      
      // Paris should have a significant mustache angle due to its latitude
      expect(mustachesRange.averageMustacheAngle).toBeGreaterThanOrEqual(25);
      expect(mustachesRange.averageMustacheAngle).toBeLessThanOrEqual(90);
    });

    test('should calculate mustaches range in Sydney', () => {
      const date = new NaturalDate(new Date(), SYDNEY.longitude);
      const mustachesRange = MustachesRange(date, SYDNEY.latitude);
      
      expect(typeof mustachesRange.winterSunrise).toBe('number');
      expect(typeof mustachesRange.winterSunset).toBe('number');
      expect(typeof mustachesRange.summerSunrise).toBe('number');
      expect(typeof mustachesRange.summerSunset).toBe('number');
      expect(typeof mustachesRange.averageMustacheAngle).toBe('number');
      
      // In Sydney (Southern hemisphere), summer sunrise should be later and sunset earlier than winter
      expect(mustachesRange.summerSunrise).toBeGreaterThan(mustachesRange.winterSunrise);
      expect(mustachesRange.summerSunset).toBeLessThan(mustachesRange.winterSunset);
      
      // All times should be within valid range
      expect(mustachesRange.winterSunrise).toBeGreaterThanOrEqual(0);
      expect(mustachesRange.winterSunrise).toBeLessThanOrEqual(360);
      expect(mustachesRange.winterSunset).toBeGreaterThanOrEqual(0);
      expect(mustachesRange.winterSunset).toBeLessThanOrEqual(360);
      expect(mustachesRange.summerSunrise).toBeGreaterThanOrEqual(0);
      expect(mustachesRange.summerSunrise).toBeLessThanOrEqual(360);
      expect(mustachesRange.summerSunset).toBeGreaterThanOrEqual(0);
      expect(mustachesRange.summerSunset).toBeLessThanOrEqual(360);
      
      // Sydney should have a significant mustache angle due to its latitude
      expect(mustachesRange.averageMustacheAngle).toBeGreaterThanOrEqual(15);
      expect(mustachesRange.averageMustacheAngle).toBeLessThanOrEqual(90);
    });

    test('should handle caching correctly', () => {
      const date = new NaturalDate(new Date(), PARIS.longitude);
      
      // First call should calculate values
      const firstResult = MustachesRange(date, PARIS.latitude);
      
      // Second call should use cached values
      const secondResult = MustachesRange(date, PARIS.latitude);
      
      // Results should be identical
      expect(secondResult).toEqual(firstResult);
    });
  });

  describe('6. Error Handling', () => {
    test('should throw error for invalid natural date', () => {
      expect(() => NaturalSunAltitude(null as any, 0)).toThrow();
      expect(() => NaturalSunEvents(null as any, 0)).toThrow();
      expect(() => NaturalMoonPosition(null as any, 0)).toThrow();
      expect(() => NaturalMoonEvents(null as any, 0)).toThrow();
      expect(() => MustachesRange(null as any, 0)).toThrow();
      
      expect(() => NaturalSunAltitude({} as any, 0)).toThrow();
      expect(() => NaturalSunEvents({} as any, 0)).toThrow();
      expect(() => NaturalMoonPosition({} as any, 0)).toThrow();
      expect(() => NaturalMoonEvents({} as any, 0)).toThrow();
      expect(() => MustachesRange({} as any, 0)).toThrow();
    });

    test('should throw error for invalid latitude', () => {
      const date = new NaturalDate(new Date(), 0);
      
      expect(() => NaturalSunAltitude(date, -91)).toThrow();
      expect(() => NaturalSunEvents(date, -91)).toThrow();
      expect(() => NaturalMoonPosition(date, -91)).toThrow();
      expect(() => NaturalMoonEvents(date, -91)).toThrow();
      expect(() => MustachesRange(date, -91)).toThrow();
      
      expect(() => NaturalSunAltitude(date, 91)).toThrow();
      expect(() => NaturalSunEvents(date, 91)).toThrow();
      expect(() => NaturalMoonPosition(date, 91)).toThrow();
      expect(() => NaturalMoonEvents(date, 91)).toThrow();
      expect(() => MustachesRange(date, 91)).toThrow();
    });
  });
});

/**
 * Helper function to find a timestamp that corresponds to a specific natural time at a given longitude.
 * @param targetNaturalTime - The target natural time in degrees (0-360)
 * @param longitude - The longitude in degrees (-180 to 180)
 * @returns The timestamp that corresponds to the target natural time
 */
function findNaturalTimeTimestamp(targetNaturalTime: number, longitude: number): number {
  const startDate = new Date();
  let closestDiff = 360;
  let closestTime = startDate.getTime();

  // Try different hours to find when natural time is closest to target
  for (let hour = 0; hour < 24; hour++) {
    const testDate = new Date(startDate);
    testDate.setUTCHours(hour, 0, 0, 0);
    const naturalDate = new NaturalDate(testDate, longitude);
    const diff = Math.abs(naturalDate.time - targetNaturalTime);
    if (diff < closestDiff) {
      closestDiff = diff;
      closestTime = testDate.getTime();
    }
  }

  return closestTime;
}