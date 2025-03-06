/**
 * @module natural-time-js
 * @description Natural time is a fresh, elegant, and coherent way of measuring the movements of time 
 here on the Earth.
 * This new time standard is based on common sense and the observation of natural cycles.
 * Our current Gregorian calendar is an artificial construct disconnected from natural cycles.
 * Natural time realigns us with the observable patterns of the cosmos:
 * It's time to return to the cosmic rhythms that have guided humanity for millennia.
 * Learn more: https://naturaltime.app
 * 
 * # Natural Time JavaScript Library
 * 
 * This JavaScript library translates Gregorian (artificial) datetime to natural datetime.
 * Natural time is defined by:
 * 
 * - 360° circular time - replacing arbitrary hours with continuous movement
 * - Make the sun back as the main source of time
 * - Years beginning at the winter solstice
 * - 13 perfect moons of 28 days = 364 days
 * - "Rainbow day(s)" - Day out of time to make the year 365 or 366 days
 * 
 * This is mathematical beauty aligned with astronomical reality.
 * 
 * ## Basic Usage
 * 
 * ```javascript
 * import { NaturalDate } from 'natural-time-js';
 * 
 * // Create a natural date for the current time at longitude 0
 * const naturalDate = new NaturalDate(new Date(), 0);
 * 
 * // Display the natural date
 * console.log(naturalDate.toString());
 * // Example output: "011)04)15 113°25 NTZ"
 * 
 * // Get specific components
 * console.log(`Year: ${naturalDate.year}`);
 * console.log(`Moon: ${naturalDate.moon}`);
 * console.log(`Day of moon: ${naturalDate.dayOfMoon}`);
 * console.log(`Time: ${naturalDate.time}°`);
 * ```
 * 
 * ## Astronomical Functions
 * 
 * The library provides astronomical functions for calculating sun and moon positions:
 * 
 * ```javascript
 * import { NaturalDate, NaturalSunEvents, NaturalMoonPosition } from 'natural-time-js';
 * 
 * const naturalDate = new NaturalDate(new Date(), 0);
 * const latitude = 45; // 45° North
 * 
 * // Get sun events for the day
 * const sunEvents = NaturalSunEvents(naturalDate, latitude);
 * console.log(`Sunrise: ${sunEvents.sunrise}°`);
 * console.log(`Sunset: ${sunEvents.sunset}°`);
 * 
 * // Get moon position and phase
 * const moonInfo = NaturalMoonPosition(naturalDate, latitude);
 * console.log(`Moon phase: ${moonInfo.phase}°`);
 * ```
 * 
 * @author Sylvain 441
 * @license CC0-1.0
 * @version 1.1.1
 */

// Export the core NaturalDate class
export { NaturalDate, yearContextCache } from './core/NaturalDate.js';

/**
 * Astronomical functions and constants for natural time calculations
 */
export { 
    NaturalSunAltitude,
    NaturalSunEvents,
    NaturalMoonPosition,
    NaturalMoonEvents,
    MustachesRange,
    HEMISPHERES,
    SEASONS,
    ANGLES,
    astroCache
} from './astronomy/celestial.js';

/**
 * Utility functions for validation and error handling
 */
export {
    isValidLatitude,
    isValidLongitude,
    isValidAngle,
    isValidTimestamp,
    isValidNaturalDate,
    isValidCacheKey,
    throwValidationError
} from './utils/validators.js'; 