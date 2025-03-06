/**
 * @module natural-time-js/celestial
 * @description The cosmic heartbeat of natural time - precise astronomical calculations that connect us to the rhythms of sun and moon.
 * 
 * While artificial time ignores the sky, natural time is anchored to celestial reality.
 * This module provides the astronomical foundation that makes natural time truly natural:
 * - Exact solar positions throughout the day
 * - Precise lunar phases and cycles
 * - Solstice and equinox calculations
 * - Location-aware sunrise, sunset, moonrise and moonset times
 */

import { NaturalDate } from '../core/NaturalDate.js';
import { Body, Observer, SearchHourAngle, SearchRiseSet, SearchAltitude, MoonPhase, Equator, Horizon, Seasons } from 'astronomy-engine';
import { 
    isValidLatitude, 
    isValidLongitude, 
    isValidNaturalDate, 
    throwValidationError 
} from '../utils/validators.js';

/**
 * Hemisphere identifiers for geographical calculations.
 * Used to determine seasonal adjustments based on location.
 * @constant
 * @enum {string}
 * @readonly
 */
export const HEMISPHERES = {
    /** Northern hemisphere (latitude >= 0) */
    NORTH: 'NORTH',
    /** Southern hemisphere (latitude < 0) */
    SOUTH: 'SOUTH'
};

/**
 * Day numbers marking the start and end of summer season.
 * These are used to determine seasonal effects on daylight calculations.
 * Note that seasons are reversed in the southern hemisphere.
 * Day 1 represents January 1st in the Gregorian calendar.
 * @constant
 * @enum {number}
 * @readonly
 */
export const SEASONS = {
    /** Day 91 (typically April 1st) - Start of summer in Northern hemisphere */
    SUMMER_START_DAY: 91,
    /** Day 273 (typically September 30th) - End of summer in Northern hemisphere */
    SUMMER_END_DAY: 273
};

/**
 * Solar altitude thresholds in degrees for different daylight conditions.
 * These values define the boundaries between different lighting conditions.
 * @constant
 * @enum {number}
 * @readonly
 */
export const ANGLES = {
    /** Altitude below which astronomical night begins (-12°) */
    NIGHT_ALTITUDE: -12,
    /** Altitude below which golden hour lighting occurs (6°) */
    GOLDEN_HOUR_ALTITUDE: 6
};

/**
 * Cache for astronomical calculations to improve performance.
 * Stores results of expensive calculations to avoid redundant computations.
 * @type {Map<string, Object>}
 */
const astroCache = new Map();

/**
 * Determines the hemisphere based on latitude.
 * This is used to adjust seasonal calculations since seasons are reversed
 * between northern and southern hemispheres.
 * 
 * @param {number} latitude - Latitude in degrees (-90 to 90)
 * @returns {string} Hemisphere identifier (NORTH or SOUTH)
 * @private
 */
const getHemisphere = (latitude) => latitude >= 0 ? HEMISPHERES.NORTH : HEMISPHERES.SOUTH;

/**
 * Determines if the current day is in the summer season based on hemisphere.
 * Summer is defined differently depending on the hemisphere:
 * - Northern hemisphere: April 1st to September 30th (days 91-273)
 * - Southern hemisphere: October 1st to March 31st (days 274-90)
 * 
 * @param {number} dayOfYear - Day of the year (1-366)
 * @param {number} latitude - Latitude in degrees (-90 to 90)
 * @returns {boolean} True if current day is in summer season
 * @private
 */
const isSummerSeason = (dayOfYear, latitude) => {
    const hemisphere = getHemisphere(latitude);
    return hemisphere === HEMISPHERES.NORTH 
        ? (dayOfYear >= SEASONS.SUMMER_START_DAY && dayOfYear <= SEASONS.SUMMER_END_DAY)
        : (dayOfYear <= SEASONS.SUMMER_START_DAY || dayOfYear >= SEASONS.SUMMER_END_DAY);
}

/**
 * Creates an observer object for astronomical calculations.
 * The observer is positioned at the specified coordinates with an elevation of 0 meters.
 * This is used as input for the astronomy-engine calculations.
 * 
 * @param {number} latitude - Latitude in degrees (-90 to 90)
 * @param {number} longitude - Longitude in degrees (-180 to 180)
 * @returns {Observer} Observer object from astronomy-engine
 * @private
 */
const createObserver = (latitude, longitude) => new Observer(latitude, longitude, 0);

/**
 * Calculates the sun's altitude at a specific natural time and location.
 * 
 * This function determines the current position of the sun in the sky for a given
 * natural date and geographical location. It provides information about the sun's
 * altitude above the horizon and its highest altitude for the day.
 * 
 * The altitude is measured in degrees above the horizon, with positive values
 * indicating the sun is visible above the horizon, and negative values indicating
 * it is below the horizon.
 * 
 * @param {NaturalDate} naturalDate - Natural date object representing the time for calculation
 * @param {number} latitude - Latitude in degrees (-90 to 90)
 * @returns {Object} Sun altitude information including:
 *   - altitude: Current sun altitude in degrees above horizon (always ≥ 0)
 *   - highestAltitude: Maximum sun altitude for the day in degrees
 * @throws {Error} If parameters are invalid or if astronomical calculations fail
 * 
 * @example
 * // Get sun altitude for current time at the Pyramids of Giza
 * const naturalDate = new NaturalDate(new Date(), 31.1341);
 * const sunInfo = NaturalSunAltitude(naturalDate, 29.9791);
 * console.log(`Current sun altitude: ${sunInfo.altitude}°`);
 * console.log(`Highest sun altitude today: ${sunInfo.highestAltitude}°`);
 */
export function NaturalSunAltitude(naturalDate, latitude) {
    // Validate inputs
    if (!isValidNaturalDate(naturalDate)) {
        throwValidationError('naturalDate', naturalDate, 'NaturalDate instance');
    }
    if (!isValidLatitude(latitude)) {
        throwValidationError('latitude', latitude, 'number between -90 and 90');
    }

    try {
        const observer = createObserver(latitude, naturalDate.longitude);
        const date = new Date(naturalDate.unixTime);
        const sun = Equator(Body.Sun, date, observer, true, false);
        
        return {
            altitude: Math.max(Horizon(date, observer, sun.ra, sun.dec).altitude, 0),
            highestAltitude: SearchHourAngle(Body.Sun, observer, 0, new Date(naturalDate.nadir)).hor.altitude
        }
    } catch (error) {
        console.error('Error in NaturalSunAltitude:', error);
        throw error;
    }
}

/**
 * Calculates sun events (rise, set, twilight times) for a specific natural date and location.
 * 
 * This function determines key solar events throughout the day, including:
 * - Sunrise and sunset times
 * - Beginning and end of astronomical night (when sun is 12° below horizon)
 * - Golden hour periods (when sun is 6° above horizon, creating warm lighting)
 * 
 * All times are returned in natural degrees (0-360), which can be interpreted as:
 * - 0° = midnight (nadir)
 * - 90° = sunrise region
 * - 180° = noon
 * - 270° = sunset region
 * 
 * For polar regions during seasonal extremes (midnight sun or polar night),
 * the function returns special values to indicate continuous daylight or darkness.
 * 
 * Results are cached for performance when calculating multiple events for the same day and location.
 * 
 * @param {NaturalDate} naturalDate - Natural date object representing the day for calculation
 * @param {number} latitude - Latitude in degrees (-90 to 90)
 * @returns {Object} Sun events in natural time degrees including:
 *   - sunrise: Sun rise time in natural degrees (0-360)
 *   - sunset: Sun set time in natural degrees (0-360)
 *   - nightStart: Time when astronomical night begins (sun 12° below horizon)
 *   - nightEnd: Time when astronomical night ends (sun 12° below horizon)
 *   - morningGoldenHour: Time when morning golden hour begins (sun 6° above horizon)
 *   - eveningGoldenHour: Time when evening golden hour begins (sun 6° above horizon)
 * @throws {Error} If parameters are invalid or if astronomical calculations fail
 * 
 * @example
 * // Get sun events for today at the Pyramids of Giza
 * const naturalDate = new NaturalDate(new Date(), 31.1341);
 * const events = NaturalSunEvents(naturalDate, 29.9791);
 * console.log(`Sunrise: ${events.sunrise}°`);
 * console.log(`Sunset: ${events.sunset}°`);
 */
export function NaturalSunEvents(naturalDate, latitude) {
    // Validate inputs
    if (!isValidNaturalDate(naturalDate)) {
        throwValidationError('naturalDate', naturalDate, 'NaturalDate instance');
    }
    if (!isValidLatitude(latitude)) {
        throwValidationError('latitude', latitude, 'number between -90 and 90');
    }

    const cacheKey = `SUN_${naturalDate.toDateString()}_${latitude}_${naturalDate.longitude}`;
    
    try {
        if (astroCache.has(cacheKey)) {
            const cachedResult = astroCache.get(cacheKey);
            if (cachedResult && typeof cachedResult === 'object') {
                return cachedResult;
            }
        }

        const observer = createObserver(latitude, naturalDate.longitude);
        const nadir = new Date(naturalDate.nadir);
        const isSummer = isSummerSeason(naturalDate.dayOfYear, latitude);

        // Helper function to handle edge cases
        const getEventTime = (searchResult, isSummerDefault) => {
            if (!searchResult) {
                return isSummer ? (isSummerDefault ? 360 : 0) : 180;
            }
            return naturalDate.getTimeOfEvent(searchResult);
        };

        const events = {
            sunrise: getEventTime(SearchRiseSet(Body.Sun, observer, +1, nadir, 1), false),
            sunset: getEventTime(SearchRiseSet(Body.Sun, observer, -1, nadir, 1), true),
            nightStart: getEventTime(SearchAltitude(Body.Sun, observer, -1, nadir, 2, ANGLES.NIGHT_ALTITUDE), true),
            nightEnd: getEventTime(SearchAltitude(Body.Sun, observer, +1, nadir, 2, ANGLES.NIGHT_ALTITUDE), false),
            morningGoldenHour: getEventTime(SearchAltitude(Body.Sun, observer, +1, nadir, 2, ANGLES.GOLDEN_HOUR_ALTITUDE), false),
            eveningGoldenHour: getEventTime(SearchAltitude(Body.Sun, observer, -1, nadir, 2, ANGLES.GOLDEN_HOUR_ALTITUDE), true)
        };

        astroCache.set(cacheKey, events);
        return events;
    } catch (error) {
        console.error('Error in NaturalSunEvents:', error);
        throw error;
    }
}

/**
 * Calculates the moon's position and phase at a specific natural time and location.
 * 
 * This function determines the current position of the moon in the sky and its phase
 * for a given natural date and geographical location. The moon's phase is measured
 * in degrees from 0-360, where:
 * - 0° = New Moon (not visible)
 * - 90° = First Quarter (half moon, waxing)
 * - 180° = Full Moon
 * - 270° = Last Quarter (half moon, waning)
 * 
 * The altitude is measured in degrees above the horizon, with positive values
 * indicating the moon is visible above the horizon, and negative values indicating
 * it is below the horizon.
 * 
 * @param {NaturalDate} naturalDate - Natural date object representing the time for calculation
 * @param {number} latitude - Latitude in degrees (-90 to 90)
 * @returns {Object} Moon position information including:
 *   - phase: Current moon phase in degrees (0-360)
 *   - altitude: Current moon altitude in degrees above horizon (always ≥ 0)
 *   - highestAltitude: Maximum moon altitude for the day in degrees
 * @throws {Error} If parameters are invalid
 * 
 * @example
 * // Get moon position and phase for current time at the Pyramids of Giza
 * const naturalDate = new NaturalDate(new Date(), 31.1341);
 * const moonInfo = NaturalMoonPosition(naturalDate, 29.9791);
 * console.log(`Moon phase: ${moonInfo.phase}°`);
 * console.log(`Moon altitude: ${moonInfo.altitude}°`);
 */
export function NaturalMoonPosition(naturalDate, latitude) {
    // Validate inputs
    if (!isValidNaturalDate(naturalDate)) {
        throwValidationError('naturalDate', naturalDate, 'NaturalDate instance');
    }
    if (!isValidLatitude(latitude)) {
        throwValidationError('latitude', latitude, 'number between -90 and 90');
    }

    try {
        const observer = createObserver(latitude, naturalDate.longitude);
        const date = new Date(naturalDate.unixTime);
        const moon = Equator(Body.Moon, date, observer, true, false);
        
        return {
            phase: MoonPhase(date),
            altitude: Math.max(Horizon(date, observer, moon.ra, moon.dec).altitude, 0),
            highestAltitude: SearchHourAngle(Body.Moon, observer, 0, new Date(naturalDate.nadir)).hor.altitude
        }
    } catch (error) {
        console.error('Error in NaturalMoonPosition:', error);
        return {
            phase: 0,
            altitude: 0,
            highestAltitude: 0
        }
    }
}

/**
 * Calculates moon rise and set events for a specific natural date and location.
 * 
 * This function determines when the moon rises and sets during a natural day.
 * Unlike the sun, the moon's rise and set times can vary significantly from day to day,
 * and sometimes the moon might not rise or set during a particular day.
 * 
 * All times are returned in natural degrees (0-360), which can be interpreted as:
 * - 0° = midnight (nadir)
 * - 90° = morning quadrant
 * - 180° = noon
 * - 270° = evening quadrant
 * 
 * If the moon doesn't rise or set during the day, the corresponding value will be null.
 * 
 * Results are cached for performance when calculating multiple events for the same day and location.
 * 
 * @param {NaturalDate} naturalDate - Natural date object representing the day for calculation
 * @param {number} latitude - Latitude in degrees (-90 to 90)
 * @returns {Object} Moon events in natural time degrees including:
 *   - moonrise: Moon rise time in natural degrees (0-360) or null if it doesn't occur
 *   - moonset: Moon set time in natural degrees (0-360) or null if it doesn't occur
 * @throws {Error} If parameters are invalid
 * 
 * @example
 * // Get moon events for today at the Pyramids of Giza
 * const naturalDate = new NaturalDate(new Date(), 31.1341);
 * const events = NaturalMoonEvents(naturalDate, 29.9791);
 * if (events.moonrise !== null) {
 *   console.log(`Moonrise: ${events.moonrise}°`);
 * } else {
 *   console.log('No moonrise today');
 * }
 */
export function NaturalMoonEvents(naturalDate, latitude) {
    // Validate inputs
    if (!isValidNaturalDate(naturalDate)) {
        throwValidationError('naturalDate', naturalDate, 'NaturalDate instance');
    }
    if (!isValidLatitude(latitude)) {
        throwValidationError('latitude', latitude, 'number between -90 and 90');
    }
    
    const cacheKey = `MOON_${naturalDate.toDateString()}_${latitude}_${naturalDate.longitude}`;
    
    try {
        if (astroCache.has(cacheKey)) {
            return astroCache.get(cacheKey);
        }

        const observer = createObserver(latitude, naturalDate.longitude);
        const nadir = new Date(naturalDate.nadir);

        const moonrise = SearchRiseSet(Body.Moon, observer, +1, nadir, 1);
        const moonset = SearchRiseSet(Body.Moon, observer, -1, nadir, 1);

        const events = {
            moonrise: naturalDate.getTimeOfEvent(moonrise),
            moonset: naturalDate.getTimeOfEvent(moonset)
        };

        astroCache.set(cacheKey, events);
        return events;
    } catch (error) {
        console.error('Error in NaturalMoonEvents:', error);
        return {
            moonrise: null,
            moonset: null
        }
    }
}

/**
 * Calculates the "mustaches range" - the seasonal variation in sunrise and sunset positions.
 * 
 * The "mustaches" refer to the path traced by sunrise and sunset positions throughout the year,
 * which forms a shape resembling a mustache when plotted on a circular natural time diagram.
 * This function calculates the extreme points of this range by comparing the sunrise and sunset
 * times at the winter and summer solstices.
 * 
 * This information is useful for:
 * - Understanding the seasonal variation in daylight at a specific location
 * - Visualizing the sun's path throughout the year
 * - Designing sundials or solar-oriented architecture
 * 
 * The average mustache angle represents the average angular distance between
 * summer and winter sunrise/sunset positions, which indicates the seasonal variation
 * in day length at the given latitude.
 * 
 * Results are cached for performance since these values only change with latitude.
 * 
 * @param {NaturalDate} naturalDate - Natural date object (used only for year context)
 * @param {number} latitude - Latitude in degrees (-90 to 90)
 * @returns {Object} Mustaches range information including:
 *   - winterSunrise: Winter solstice sunrise time in natural degrees
 *   - winterSunset: Winter solstice sunset time in natural degrees
 *   - summerSunrise: Summer solstice sunrise time in natural degrees
 *   - summerSunset: Summer solstice sunset time in natural degrees
 *   - averageMustacheAngle: Average angular distance between solstice sunrise/sunset positions (0-90°)
 * @throws {Error} If parameters are invalid
 * 
 * @example
 * // Calculate mustaches range for the Pyramids of Giza
 * const naturalDate = new NaturalDate(new Date(), 31.1341);
 * const mustaches = MustachesRange(naturalDate, 29.9791);
 * console.log(`Average mustache angle: ${mustaches.averageMustacheAngle}°`);
 * console.log(`Winter sunrise: ${mustaches.winterSunrise}°, sunset: ${mustaches.winterSunset}°`);
 * console.log(`Summer sunrise: ${mustaches.summerSunrise}°, sunset: ${mustaches.summerSunset}°`);
 */
export function MustachesRange(naturalDate, latitude) {
   // Validate inputs
   if (!isValidNaturalDate(naturalDate)) {
       throwValidationError('naturalDate', naturalDate, 'NaturalDate instance');
   }
   if (!isValidLatitude(latitude)) {
       throwValidationError('latitude', latitude, 'number between -90 and 90');
   }
   
   const cacheKey = `MUSTACHES_${naturalDate.year}_${latitude}`;
   
   try {
       if (astroCache.has(cacheKey)) {
           return astroCache.get(cacheKey);
       }

       const currentYear = new Date(naturalDate.unixTime).getFullYear();
       const currentSeasons = Seasons(currentYear);
       
       const winterSolsticeSunEvents = NaturalSunEvents(
           new NaturalDate(currentSeasons.dec_solstice.date, 0), 
           latitude
       );
       const summerSolsticeSunEvents = NaturalSunEvents(
           new NaturalDate(currentSeasons.jun_solstice.date, 0), 
           latitude
       );

       const averageMustacheAngle = Math.min(Math.max(
           latitude >= 0 
               ? (winterSolsticeSunEvents.sunrise - summerSolsticeSunEvents.sunrise + 
                  summerSolsticeSunEvents.sunset - winterSolsticeSunEvents.sunset) / 4
               : (summerSolsticeSunEvents.sunrise - winterSolsticeSunEvents.sunrise + 
                  winterSolsticeSunEvents.sunset - summerSolsticeSunEvents.sunset) / 4,
           0
       ), 90);

       const result = {
           winterSunrise: winterSolsticeSunEvents.sunrise,
           winterSunset: winterSolsticeSunEvents.sunset,
           summerSunrise: summerSolsticeSunEvents.sunrise,
           summerSunset: summerSolsticeSunEvents.sunset,
           averageMustacheAngle
       };

       astroCache.set(cacheKey, result);
       return result;
   } catch (error) {
       console.error('Error calculating mustaches range:', error);
       return {
           winterSunrise: 0,
           winterSunset: 0,
           summerSunrise: 0,
           summerSunset: 0,
           averageMustacheAngle: 0
       }
   }
}

// Export the cache for testing purposes
export { astroCache };