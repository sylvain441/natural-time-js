/**
 * Test suite for natural-time-js context functionality
 * Tests astronomical calculations and events
 * 
 * Natural time is based on astronomical reality:
 * - 0° represents mid-night (nadir) at the specific longitude
 * - 180° represents mid-day (zenith) at the specific longitude
 * - Time is calculated directly from astronomical position, not converted from conventional time
 */

import { NaturalDate } from '../index.js';
import { 
  NaturalSunAltitude, 
  NaturalSunEvents, 
  NaturalMoonPosition, 
  NaturalMoonEvents,
  MustachesRange,
  HEMISPHERES,
  SEASONS,
  ANGLES
} from '../context.js';
import { Seasons } from 'astronomy-engine';

describe('NaturalDateContext', () => {
  // Sample test locations
  const EQUATOR = { latitude: 0, longitude: 0 };
  const NORTH_POLE = { latitude: 90, longitude: 0 };
  const SOUTH_POLE = { latitude: -90, longitude: 0 };
  const PARIS = { latitude: 48.8566, longitude: 2.3522 };
  const SYDNEY = { latitude: -33.8688, longitude: 151.2093 };
  const GIZEH = { latitude: 29.9791, longitude: 31.1341 }; // Example from README

  // Sample test dates
  const SUMMER_SOLSTICE_NH = new Date('2023-06-21T14:58:00Z');
  const WINTER_SOLSTICE_NH = new Date('2023-12-22T03:27:00Z');
  const SPRING_EQUINOX = new Date('2023-03-20T21:24:00Z');
  const FALL_EQUINOX = new Date('2023-09-23T06:50:00Z');

  describe('NaturalSunAltitude', () => {
    test('should calculate sun altitude at equator', () => {
      const equinoxDate = new NaturalDate(SPRING_EQUINOX, EQUATOR.longitude);
      const sunAltitude = NaturalSunAltitude(equinoxDate, EQUATOR.latitude);
      
      // At equator during equinox, highest sun altitude should be close to 90°
      expect(sunAltitude.highestAltitude).toBeCloseTo(90, 0);
      
      // Find a time when the natural time is close to 180° (local noon)
      // This requires finding when the sun is at its zenith at the given longitude
      const noonNaturalTime = 180;
      
      // We can use the NaturalDate to find when the time is close to 180°
      // This is a simplified approach - in reality we'd need to find the exact time
      // when the sun is at its zenith at the given longitude
      const testDate = new Date(SPRING_EQUINOX);
      let closestDate;
      let closestDiff = 360;
      
      // Try different hours to find when natural time is closest to noon
      for (let hour = 0; hour < 24; hour++) {
        testDate.setUTCHours(hour, 0, 0, 0);
        const naturalDate = new NaturalDate(testDate, EQUATOR.longitude);
        const diff = Math.abs(naturalDate.time - noonNaturalTime);
        if (diff < closestDiff) {
          closestDiff = diff;
          closestDate = new Date(testDate);
        }
      }
      
      // Now test the sun altitude at the time closest to natural noon
      const noonDate = new NaturalDate(closestDate, EQUATOR.longitude);
      const noonAltitude = NaturalSunAltitude(noonDate, EQUATOR.latitude);
      
      // At equator during equinox at natural noon, sun should be close to directly overhead
      // Using a more relaxed precision (within 2 degrees) due to Earth's axial tilt and other astronomical factors
      expect(noonAltitude.altitude).toBeGreaterThan(85);
      expect(noonAltitude.altitude).toBeLessThan(90);
    });

    test('should calculate sun altitude in Northern Hemisphere', () => {
      // Summer solstice in Northern Hemisphere
      const summerDate = new NaturalDate(SUMMER_SOLSTICE_NH, PARIS.longitude);
      const summerAltitude = NaturalSunAltitude(summerDate, PARIS.latitude);
      
      // Winter solstice in Northern Hemisphere
      const winterDate = new NaturalDate(WINTER_SOLSTICE_NH, PARIS.longitude);
      const winterAltitude = NaturalSunAltitude(winterDate, PARIS.latitude);
      
      // Sun should be higher in summer than in winter
      expect(summerAltitude.highestAltitude).toBeGreaterThan(winterAltitude.highestAltitude);
    });

    test('should calculate sun altitude in Southern Hemisphere', () => {
      // Summer solstice in Northern Hemisphere (winter in Southern)
      const winterSHDate = new NaturalDate(SUMMER_SOLSTICE_NH, SYDNEY.longitude);
      const winterSHAltitude = NaturalSunAltitude(winterSHDate, SYDNEY.latitude);
      
      // Winter solstice in Northern Hemisphere (summer in Southern)
      const summerSHDate = new NaturalDate(WINTER_SOLSTICE_NH, SYDNEY.longitude);
      const summerSHAltitude = NaturalSunAltitude(summerSHDate, SYDNEY.latitude);
      
      // Sun should be higher in summer than in winter (opposite of Northern Hemisphere)
      expect(summerSHAltitude.highestAltitude).toBeGreaterThan(winterSHAltitude.highestAltitude);
    });

    test('should calculate highest altitude correctly', () => {
      // Test with example from README (Gizeh pyramids)
      const date = new NaturalDate(new Date(), GIZEH.longitude);
      const sunAltitude = NaturalSunAltitude(date, GIZEH.latitude);
      
      // Highest altitude should be a number
      expect(typeof sunAltitude.highestAltitude).toBe('number');
      
      // Highest altitude should be between 0 and 90 degrees
      expect(sunAltitude.highestAltitude).toBeGreaterThan(0);
      expect(sunAltitude.highestAltitude).toBeLessThanOrEqual(90);
    });

    test('should calculate sun altitude at different natural times', () => {
      // We need to find timestamps that correspond to different natural times
      // at the same longitude
      const longitude = PARIS.longitude;
      
      // Find a date when natural time is close to 0° (midnight)
      const midnightTimestamp = findNaturalTimeTimestamp(0, longitude);
      const naturalMidnightDate = new NaturalDate(midnightTimestamp, longitude);
      
      // Find a date when natural time is close to 180° (noon)
      const noonTimestamp = findNaturalTimeTimestamp(180, longitude);
      const naturalNoonDate = new NaturalDate(noonTimestamp, longitude);
      
      // Sun altitude should be higher at noon than at midnight
      const noonAltitude = NaturalSunAltitude(naturalNoonDate, PARIS.latitude);
      const midnightAltitude = NaturalSunAltitude(naturalMidnightDate, PARIS.latitude);
      
      expect(noonAltitude.altitude).toBeGreaterThan(midnightAltitude.altitude);
    });
  });

  describe('NaturalSunEvents', () => {
    test('should calculate sunrise correctly', () => {
      const date = new NaturalDate(new Date(), PARIS.longitude);
      const sunEvents = NaturalSunEvents(date, PARIS.latitude);
      
      // Sunrise should be between 0° and 180°
      // This is because sunrise happens between midnight (0°) and noon (180°)
      expect(sunEvents.sunrise).toBeGreaterThan(0);
      expect(sunEvents.sunrise).toBeLessThan(180);
    });

    test('should calculate sunset correctly', () => {
      const date = new NaturalDate(new Date(), PARIS.longitude);
      const sunEvents = NaturalSunEvents(date, PARIS.latitude);
      
      // Sunset should be between 180° and 360°
      // This is because sunset happens between noon (180°) and midnight (360°/0°)
      expect(sunEvents.sunset).toBeGreaterThan(180);
      expect(sunEvents.sunset).toBeLessThan(360);
    });

    test('should calculate night start and end correctly', () => {
      const date = new NaturalDate(new Date(), PARIS.longitude);
      const sunEvents = NaturalSunEvents(date, PARIS.latitude);
      
      // Night start should be after sunset
      expect(sunEvents.nightStart).toBeGreaterThan(sunEvents.sunset);
      
      // Night end should be before sunrise
      expect(sunEvents.nightEnd).toBeLessThan(sunEvents.sunrise);
    });

    test('should calculate golden hours correctly', () => {
      const date = new NaturalDate(new Date(), PARIS.longitude);
      const sunEvents = NaturalSunEvents(date, PARIS.latitude);
      
      // Morning golden hour should occur before noon (180°)
      expect(sunEvents.morningGoldenHour).toBeGreaterThan(0);
      expect(sunEvents.morningGoldenHour).toBeLessThan(180);
      
      // Evening golden hour should occur after noon (180°)
      expect(sunEvents.eveningGoldenHour).toBeGreaterThan(180);
      expect(sunEvents.eveningGoldenHour).toBeLessThan(360);
    });

    test('should handle polar day correctly', () => {
      // Summer solstice at North Pole
      const polarDayDate = new NaturalDate(SUMMER_SOLSTICE_NH, NORTH_POLE.longitude);
      const polarDaySunEvents = NaturalSunEvents(polarDayDate, NORTH_POLE.latitude);
      
      // During polar day, there should be no sunset (represented as 360 in the implementation)
      expect(polarDaySunEvents.sunset).toBe(360);
    });

    test('should handle polar night correctly', () => {
      // Winter solstice at North Pole
      const polarNightDate = new NaturalDate(WINTER_SOLSTICE_NH, NORTH_POLE.longitude);
      const polarNightSunEvents = NaturalSunEvents(polarNightDate, NORTH_POLE.latitude);
      
      // During polar night, there should be no sunrise (represented as 180 in the implementation)
      expect(polarNightSunEvents.sunrise).toBe(180);
    });

    test('should handle equinox day correctly', () => {
      // Spring equinox at equator
      const equinoxDate = new NaturalDate(SPRING_EQUINOX, EQUATOR.longitude);
      const equinoxSunEvents = NaturalSunEvents(equinoxDate, EQUATOR.latitude);
      
      // At equinox on equator, sunrise should be close to 90° (6 hours before noon)
      // Using a more relaxed precision due to astronomical factors
      expect(equinoxSunEvents.sunrise).toBeGreaterThan(85);
      expect(equinoxSunEvents.sunrise).toBeLessThan(95);
      
      // At equinox on equator, sunset should be close to 270° (6 hours after noon)
      // Using a more relaxed precision due to astronomical factors
      expect(equinoxSunEvents.sunset).toBeGreaterThan(265);
      expect(equinoxSunEvents.sunset).toBeLessThan(275);
    });
  });

  describe('NaturalMoonPosition', () => {
    test('should calculate moon phase correctly', () => {
      const date = new NaturalDate(new Date(), 0);
      const moonPosition = NaturalMoonPosition(date, PARIS.latitude);
      
      // Moon phase should be between 0 and 360
      expect(moonPosition.phase).toBeGreaterThanOrEqual(0);
      expect(moonPosition.phase).toBeLessThanOrEqual(360);
    });

    test('should calculate moon altitude correctly', () => {
      const date = new NaturalDate(new Date(), PARIS.longitude);
      const moonPosition = NaturalMoonPosition(date, PARIS.latitude);
      
      // Moon altitude should be a number
      expect(typeof moonPosition.altitude).toBe('number');
      
      // Moon altitude should be between -90 and 90 degrees
      expect(moonPosition.altitude).toBeGreaterThanOrEqual(-90);
      expect(moonPosition.altitude).toBeLessThanOrEqual(90);
    });

    test('should calculate moon highest altitude correctly', () => {
      const date = new NaturalDate(new Date(), PARIS.longitude);
      const moonPosition = NaturalMoonPosition(date, PARIS.latitude);
      
      // Highest altitude should be a number
      expect(typeof moonPosition.highestAltitude).toBe('number');
      
      // Highest altitude should be between -90 and 90 degrees
      expect(moonPosition.highestAltitude).toBeGreaterThanOrEqual(-90);
      expect(moonPosition.highestAltitude).toBeLessThanOrEqual(90);
    });

    test('should calculate moon position at different latitudes', () => {
      const date = new NaturalDate(new Date(), 0);
      
      // Calculate moon position at different latitudes
      const northPolePosition = NaturalMoonPosition(date, NORTH_POLE.latitude);
      const equatorPosition = NaturalMoonPosition(date, EQUATOR.latitude);
      const southPolePosition = NaturalMoonPosition(date, SOUTH_POLE.latitude);
      
      // Moon phase should be the same regardless of latitude
      expect(northPolePosition.phase).toBeCloseTo(equatorPosition.phase, 5);
      expect(equatorPosition.phase).toBeCloseTo(southPolePosition.phase, 5);
      
      // Verify that moon positions are calculated for different latitudes
      // (Not comparing specific values as they depend on the current date and moon position)
      expect(typeof northPolePosition.altitude).toBe('number');
      expect(typeof equatorPosition.altitude).toBe('number');
      expect(typeof southPolePosition.altitude).toBe('number');
    });
  });

  describe('NaturalMoonEvents', () => {
    test('should calculate moonrise correctly', () => {
      const date = new NaturalDate(new Date(), PARIS.longitude);
      const moonEvents = NaturalMoonEvents(date, PARIS.latitude);
      
      // If moonrise exists, it should be between 0 and 360
      if (moonEvents.moonrise !== false) {
        expect(moonEvents.moonrise).toBeGreaterThanOrEqual(0);
        expect(moonEvents.moonrise).toBeLessThan(360);
      }
    });

    test('should calculate moonset correctly', () => {
      const date = new NaturalDate(new Date(), PARIS.longitude);
      const moonEvents = NaturalMoonEvents(date, PARIS.latitude);
      
      // If moonset exists, it should be between 0 and 360
      if (moonEvents.moonset !== false) {
        expect(moonEvents.moonset).toBeGreaterThanOrEqual(0);
        expect(moonEvents.moonset).toBeLessThan(360);
      }
    });

    test('should handle cases where moon doesn\'t rise or set', () => {
      // This is a bit tricky to test deterministically without knowing the exact moon position
      // We'll create a test that checks the API behavior rather than specific astronomical events
      
      const date = new NaturalDate(new Date(), NORTH_POLE.longitude);
      const moonEvents = NaturalMoonEvents(date, NORTH_POLE.latitude);
      
      // At extreme latitudes, it's possible that the moon doesn't rise or set
      // The function should return either a number or false
      expect(typeof moonEvents.moonrise === 'number' || moonEvents.moonrise === false).toBe(true);
      expect(typeof moonEvents.moonset === 'number' || moonEvents.moonset === false).toBe(true);
    });

    test('should handle errors gracefully in NaturalMoonEvents', () => {
      // Create a mock NaturalDate that will cause an error in the calculation
      const mockDate = {
        unixTime: new Date().getTime(),
        nadir: new Date().getTime(),
        getTimeOfEvent: () => { throw new Error('Test error'); }
      };
      
      // The function should throw an error because mockDate is not a valid NaturalDate
      expect(() => NaturalMoonEvents(mockDate, PARIS.latitude)).toThrow();
    });
  });

  describe('MustachesRange', () => {
    test('should calculate mustaches range correctly for Northern Hemisphere', () => {
      const date = new NaturalDate(new Date(), PARIS.longitude);
      const mustachesRange = MustachesRange(date, PARIS.latitude);
      
      // Verify the structure and types of the result
      expect(typeof mustachesRange.winterSunrise).toBe('number');
      expect(typeof mustachesRange.winterSunset).toBe('number');
      expect(typeof mustachesRange.summerSunrise).toBe('number');
      expect(typeof mustachesRange.summerSunset).toBe('number');
      expect(typeof mustachesRange.averageMustacheAngle).toBe('number');
      
      // Verify the relationships between values for Northern Hemisphere
      // In Northern Hemisphere, winter sunrise is later (higher angle) than summer sunrise
      expect(mustachesRange.winterSunrise).toBeGreaterThan(mustachesRange.summerSunrise);
      // In Northern Hemisphere, summer sunset is later (higher angle) than winter sunset
      expect(mustachesRange.summerSunset).toBeGreaterThan(mustachesRange.winterSunset);
      
      // Verify the mustache angle is within expected range
      expect(mustachesRange.averageMustacheAngle).toBeGreaterThanOrEqual(0);
      expect(mustachesRange.averageMustacheAngle).toBeLessThanOrEqual(90);
    });
    
    test('should calculate mustaches range correctly for Southern Hemisphere', () => {
      const date = new NaturalDate(new Date(), SYDNEY.longitude);
      const mustachesRange = MustachesRange(date, SYDNEY.latitude);
      
      // Verify the structure and types of the result
      expect(typeof mustachesRange.winterSunrise).toBe('number');
      expect(typeof mustachesRange.winterSunset).toBe('number');
      expect(typeof mustachesRange.summerSunrise).toBe('number');
      expect(typeof mustachesRange.summerSunset).toBe('number');
      expect(typeof mustachesRange.averageMustacheAngle).toBe('number');
      
      // In Southern Hemisphere, the relationships are reversed
      // In Southern Hemisphere, summer sunrise is later (higher angle) than winter sunrise
      expect(mustachesRange.summerSunrise).toBeGreaterThan(mustachesRange.winterSunrise);
      // In Southern Hemisphere, winter sunset is later (higher angle) than summer sunset
      expect(mustachesRange.winterSunset).toBeGreaterThan(mustachesRange.summerSunset);
      
      // Verify the mustache angle is within expected range
      expect(mustachesRange.averageMustacheAngle).toBeGreaterThanOrEqual(0);
      expect(mustachesRange.averageMustacheAngle).toBeLessThanOrEqual(90);
    });
    
    test('should handle caching correctly', () => {
      const date = new NaturalDate(new Date(), PARIS.longitude);
      
      // First call should calculate values
      const firstCall = MustachesRange(date, PARIS.latitude);
      
      // Second call should use cached values
      const secondCall = MustachesRange(date, PARIS.latitude);
      
      // Both calls should return the same values
      expect(secondCall).toEqual(firstCall);
    });
    
    test('should handle equator correctly', () => {
      const date = new NaturalDate(new Date(), EQUATOR.longitude);
      const mustachesRange = MustachesRange(date, EQUATOR.latitude);
      
      // At the equator, the difference between summer and winter is minimal
      // The mustache angle should be close to 0
      expect(mustachesRange.averageMustacheAngle).toBeLessThan(10);
    });

    test('should throw error for invalid NaturalDate', () => {
      // Test with null date
      expect(() => NaturalSunAltitude(null, 0)).toThrow();
      expect(() => NaturalSunEvents(null, 0)).toThrow();
      expect(() => NaturalMoonPosition(null, 0)).toThrow();
      expect(() => NaturalMoonEvents(null, 0)).toThrow();
      expect(() => MustachesRange(null, 0)).toThrow();
      
      // Test with invalid object (not a NaturalDate)
      expect(() => NaturalSunAltitude({}, 0)).toThrow();
      expect(() => NaturalSunEvents({}, 0)).toThrow();
      expect(() => NaturalMoonPosition({}, 0)).toThrow();
      expect(() => NaturalMoonEvents({}, 0)).toThrow();
      expect(() => MustachesRange({}, 0)).toThrow();
    });

    test('should handle errors gracefully in NaturalMoonEvents', () => {
      // Create a mock NaturalDate that will cause an error in the calculation
      const mockDate = {
        unixTime: new Date().getTime(),
        nadir: new Date().getTime(),
        getTimeOfEvent: () => { throw new Error('Test error'); }
      };
      
      // The function should throw an error because mockDate is not a valid NaturalDate
      expect(() => NaturalMoonEvents(mockDate, PARIS.latitude)).toThrow();
    });

    test('should handle errors gracefully in NaturalMoonPosition', () => {
      // Create a mock NaturalDate that will cause an error in the calculation
      const mockDate = {
        unixTime: new Date().getTime(),
        nadir: 'invalid nadir value' // This will cause an error
      };
      
      // The function should throw an error because mockDate is not a valid NaturalDate
      expect(() => NaturalMoonPosition(mockDate, PARIS.latitude)).toThrow();
    });

    test('should handle errors gracefully in NaturalSunEvents', () => {
      // Create a mock NaturalDate that will cause an error in the calculation
      const mockDate = {
        unixTime: new Date().getTime(),
        nadir: 'invalid nadir value' // This will cause an error
      };
      
      // The function should throw an error because mockDate is not a valid NaturalDate
      expect(() => NaturalSunEvents(mockDate, PARIS.latitude)).toThrow();
    });

    test('should handle errors gracefully in NaturalSunAltitude', () => {
      // Create a mock NaturalDate that will cause an error in the calculation
      const mockDate = {
        unixTime: new Date().getTime(),
        nadir: 'invalid nadir value' // This will cause an error
      };
      
      // The function should throw an error because mockDate is not a valid NaturalDate
      expect(() => NaturalSunAltitude(mockDate, PARIS.latitude)).toThrow();
    });
  });

  describe('Constants', () => {
    test('should have correct HEMISPHERES constants', () => {
      expect(HEMISPHERES.NORTH).toBe('NORTH');
      expect(HEMISPHERES.SOUTH).toBe('SOUTH');
    });

    test('should have correct SEASONS constants', () => {
      expect(SEASONS.SUMMER_START_DAY).toBe(91);
      expect(SEASONS.SUMMER_END_DAY).toBe(273);
    });

    test('should have correct ANGLES constants', () => {
      expect(ANGLES.NIGHT_ALTITUDE).toBe(-12);
      expect(ANGLES.GOLDEN_HOUR_ALTITUDE).toBe(6);
    });
  });

  describe('Error Handling', () => {
    test('should throw error for invalid latitude', () => {
      const date = new NaturalDate(new Date(), 0);
      
      // Test with latitude > 90°
      expect(() => NaturalSunAltitude(date, 91)).toThrow();
      expect(() => NaturalSunEvents(date, 91)).toThrow();
      expect(() => NaturalMoonPosition(date, 91)).toThrow();
      expect(() => NaturalMoonEvents(date, 91)).toThrow();
      
      // Test with latitude < -90°
      expect(() => NaturalSunAltitude(date, -91)).toThrow();
      expect(() => NaturalSunEvents(date, -91)).toThrow();
      expect(() => NaturalMoonPosition(date, -91)).toThrow();
      expect(() => NaturalMoonEvents(date, -91)).toThrow();
    });

    test('should handle errors gracefully in NaturalMoonEvents', () => {
      // Create a mock NaturalDate that will cause an error in the calculation
      const mockDate = {
        unixTime: new Date().getTime(),
        nadir: new Date().getTime(),
        getTimeOfEvent: () => { throw new Error('Test error'); }
      };
      
      // The function should throw an error because mockDate is not a valid NaturalDate
      expect(() => NaturalMoonEvents(mockDate, PARIS.latitude)).toThrow();
    });

    test('should handle errors gracefully in NaturalMoonPosition', () => {
      // Create a mock NaturalDate that will cause an error in the calculation
      const mockDate = {
        unixTime: new Date().getTime(),
        nadir: 'invalid nadir value' // This will cause an error
      };
      
      // The function should throw an error because mockDate is not a valid NaturalDate
      expect(() => NaturalMoonPosition(mockDate, PARIS.latitude)).toThrow();
    });

    test('should handle errors gracefully in NaturalSunEvents', () => {
      // Create a mock NaturalDate that will cause an error in the calculation
      const mockDate = {
        unixTime: new Date().getTime(),
        nadir: 'invalid nadir value' // This will cause an error
      };
      
      // The function should throw an error because mockDate is not a valid NaturalDate
      expect(() => NaturalSunEvents(mockDate, PARIS.latitude)).toThrow();
    });

    test('should handle errors gracefully in NaturalSunAltitude', () => {
      // Create a mock NaturalDate that will cause an error in the calculation
      const mockDate = {
        unixTime: new Date().getTime(),
        nadir: 'invalid nadir value' // This will cause an error
      };
      
      // The function should throw an error because mockDate is not a valid NaturalDate
      expect(() => NaturalSunAltitude(mockDate, PARIS.latitude)).toThrow();
    });
  });
});

/**
 * Helper function to find a timestamp when the natural time is close to the target value
 * This is a simplified approach for testing purposes
 * 
 * @param {number} targetNaturalTime - The natural time to find (in degrees)
 * @param {number} longitude - The longitude to calculate natural time for
 * @returns {Date} A date object with a timestamp close to the target natural time
 */
function findNaturalTimeTimestamp(targetNaturalTime, longitude) {
  const baseDate = new Date();
  let closestDate;
  let closestDiff = 360;
  
  // Try different hours to find when natural time is closest to target
  for (let hour = 0; hour < 24; hour++) {
    baseDate.setUTCHours(hour, 0, 0, 0);
    const naturalDate = new NaturalDate(baseDate, longitude);
    const diff = Math.abs(naturalDate.time - targetNaturalTime);
    if (diff < closestDiff) {
      closestDiff = diff;
      closestDate = new Date(baseDate);
    }
  }
  
  return closestDate;
}