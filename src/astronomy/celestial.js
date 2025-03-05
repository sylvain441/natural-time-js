/**
 * @module celestial
 * @description Provides astronomical calculations and events for natural time, including sun and moon positions
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
 * Hemisphere identifiers for geographical calculations
 * @constant
 * @enum {string}
 * @readonly
 */
export const HEMISPHERES = {
    NORTH: 'NORTH',
    SOUTH: 'SOUTH'
};

/**
 * Day numbers marking the start and end of summer season
 * Day 1 represents January 1st
 * @constant
 * @enum {number}
 * @readonly
 */
export const SEASONS = {
    /** Day 91 (typically April 1st) */
    SUMMER_START_DAY: 91,
    /** Day 273 (typically September 30th) */
    SUMMER_END_DAY: 273
};

/**
 * Solar altitude thresholds in degrees for different daylight conditions
 * @constant
 * @enum {number}
 * @readonly
 */
export const ANGLES = {
    NIGHT_ALTITUDE: -12,
    GOLDEN_HOUR_ALTITUDE: 6
};

// Move cache to its own module for better separation of concerns
const astroCache = new Map();

/**
 * Determines the hemisphere based on latitude
 * @param {number} latitude - Latitude in degrees (-90 to 90)
 * @returns {string} HEMISPHERES.NORTH or HEMISPHERES.SOUTH
 * @private
 */
const getHemisphere = (latitude) => latitude >= 0 ? HEMISPHERES.NORTH : HEMISPHERES.SOUTH;

/**
 * Determines if the given day is in summer season for the specified latitude
 * @param {number} dayOfYear - Day of the year (1-366)
 * @param {number} latitude - Latitude in degrees (-90 to 90)
 * @returns {boolean} True if the day is in summer season
 * @private
 */
const isSummerSeason = (dayOfYear, latitude) => {
    const hemisphere = getHemisphere(latitude);
    return hemisphere === HEMISPHERES.NORTH 
        ? (dayOfYear >= SEASONS.SUMMER_START_DAY && dayOfYear <= SEASONS.SUMMER_END_DAY)
        : (dayOfYear <= SEASONS.SUMMER_START_DAY || dayOfYear >= SEASONS.SUMMER_END_DAY);
}

/**
 * Creates an astronomical observer at the specified coordinates
 * @param {number} latitude - Latitude in degrees (-90 to 90)
 * @param {number} longitude - Longitude in degrees (-180 to 180)
 * @returns {Observer} Astronomy-engine observer instance
 * @private
 */
const createObserver = (latitude, longitude) => new Observer(latitude, longitude, 0);

/**
 * Calculates sun altitude data for a given natural date and latitude
 * @param {NaturalDate} naturalDate - Natural date instance
 * @param {number} latitude - Latitude in degrees (-90 to 90)
 * @returns {{
 *   altitude: number,
 *   highestAltitude: number
 * }} Sun altitude data
 * @throws {Error} If inputs are invalid or calculation fails
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
 * Calculates sun-related events for a given natural date and latitude
 * @param {NaturalDate} naturalDate - Natural date instance
 * @param {number} latitude - Latitude in degrees (-90 to 90)
 * @returns {{
 *   sunrise: number,
 *   sunset: number,
 *   nightStart: number,
 *   nightEnd: number,
 *   morningGoldenHour: number,
 *   eveningGoldenHour: number
 * }} Sun events in natural degrees (0-360)
 * @throws {Error} If inputs are invalid or calculation fails
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
 * Calculates moon position and phase data for a given natural date and latitude
 * @param {NaturalDate} naturalDate - Natural date instance
 * @param {number} latitude - Latitude in degrees (-90 to 90)
 * @returns {{
 *   phase: number,
 *   altitude: number,
 *   highestAltitude: number
 * }} Moon position and phase data
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
 * Calculates moon rise and set events for a given natural date and latitude
 * @param {NaturalDate} naturalDate - Natural date instance
 * @param {number} latitude - Latitude in degrees (-90 to 90)
 * @returns {{
 *   moonrise: number|null,
 *   moonset: number|null
 * }} Moon events in natural degrees (0-360)
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
 * Calculates the range of sun positions between winter and summer solstices (average mustaches angle)
 * @param {NaturalDate} naturalDate - Natural date instance
 * @param {number} latitude - Latitude in degrees (-90 to 90)
 * @returns {{
*   winterSunrise: number,
*   winterSunset: number,
*   summerSunrise: number,
*   summerSunset: number,
*   averageMustacheAngle: number
* }} Solstice sun positions and mustache angle
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