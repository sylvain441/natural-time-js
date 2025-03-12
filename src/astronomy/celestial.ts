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

import { NaturalDate } from '../core/NaturalDate';
import { Body, Observer, SearchHourAngle, SearchRiseSet, SearchAltitude, MoonPhase, Equator, Horizon, Seasons } from 'astronomy-engine';
import { 
    isValidLatitude, 
    isValidLongitude, 
    isValidNaturalDate, 
    throwValidationError 
} from '../utils/validators';

/**
 * Hemisphere identifiers for geographical calculations.
 */
export enum HEMISPHERES {
    /** Northern hemisphere (latitude >= 0) */
    NORTH = 'NORTH',
    /** Southern hemisphere (latitude < 0) */
    SOUTH = 'SOUTH'
}

/**
 * Day numbers marking the start and end of summer season.
 */
export const SEASONS = {
    /** Day 91 (typically April 1st) - Start of summer in Northern hemisphere */
    SUMMER_START_DAY: 91,
    /** Day 273 (typically September 30th) - End of summer in Northern hemisphere */
    SUMMER_END_DAY: 273
} as const;

/**
 * Solar altitude thresholds in degrees for different daylight conditions.
 */
export const ANGLES = {
    /** Altitude below which astronomical night begins (-12°) */
    NIGHT_ALTITUDE: -12,
    /** Altitude below which golden hour lighting occurs (6°) */
    GOLDEN_HOUR_ALTITUDE: 6
} as const;

/**
 * Interface for sun altitude information
 */
interface SunAltitude {
    altitude: number;
    highestAltitude: number;
}

/**
 * Interface for sun events
 */
interface SunEvents {
    sunrise: number;
    sunset: number;
    nightStart: number;
    nightEnd: number;
    morningGoldenHour: number;
    eveningGoldenHour: number;
}

/**
 * Interface for moon position information
 */
interface MoonPosition {
    altitude: number;
    phase: number;
    illumination: number;
}

/**
 * Interface for moon events
 */
interface MoonEvents {
    moonrise: number;
    moonset: number;
    highestAltitude: number;
}

/**
 * Interface for mustaches range information
 */
interface MustachesRange {
    winterSunrise: number;
    winterSunset: number;
    summerSunrise: number;
    summerSunset: number;
    averageMustacheAngle: number;
}

/**
 * Cache for astronomical calculations to improve performance.
 */
const astroCache: Map<string, SunEvents | MoonEvents | MustachesRange> = new Map();

/**
 * Determines the hemisphere based on latitude.
 */
const getHemisphere = (latitude: number): HEMISPHERES => 
    latitude >= 0 ? HEMISPHERES.NORTH : HEMISPHERES.SOUTH;

/**
 * Determines if the current day is in the summer season based on hemisphere.
 */
const isSummerSeason = (dayOfYear: number, latitude: number): boolean => {
    const hemisphere = getHemisphere(latitude);
    return hemisphere === HEMISPHERES.NORTH 
        ? (dayOfYear >= SEASONS.SUMMER_START_DAY && dayOfYear <= SEASONS.SUMMER_END_DAY)
        : (dayOfYear <= SEASONS.SUMMER_START_DAY || dayOfYear >= SEASONS.SUMMER_END_DAY);
}

/**
 * Creates an observer object for astronomical calculations.
 */
const createObserver = (latitude: number, longitude: number): Observer => 
    new Observer(latitude, longitude, 0);

/**
 * Calculates the sun's altitude at a specific natural time and location.
 */
export function NaturalSunAltitude(naturalDate: NaturalDate, latitude: number): SunAltitude {
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
        };
    } catch (error) {
        console.error('Error in NaturalSunAltitude:', error);
        throw error;
    }
}

/**
 * Calculates sun events for a specific natural date and location.
 */
export function NaturalSunEvents(naturalDate: NaturalDate, latitude: number): SunEvents {
    // Validate inputs
    if (!isValidNaturalDate(naturalDate)) {
        throwValidationError('naturalDate', naturalDate, 'NaturalDate instance');
    }
    if (!isValidLatitude(latitude)) {
        throwValidationError('latitude', latitude, 'number between -90 and 90');
    }

    const cacheKey = `SUN_${naturalDate.toDateString()}_${latitude}_${naturalDate.longitude}`;
    
    try {
        const cachedResult = astroCache.get(cacheKey);
        if (cachedResult && 'sunrise' in cachedResult) {
            return cachedResult as SunEvents;
        }

        const observer = createObserver(latitude, naturalDate.longitude);
        const nadir = new Date(naturalDate.nadir);
        const isSummer = isSummerSeason(naturalDate.dayOfYear, latitude);

        // Helper function to handle edge cases
        const getEventTime = (searchResult: { date: Date } | null, isSummerDefault: boolean): number => {
            if (!searchResult) {
                return isSummer ? (isSummerDefault ? 360 : 0) : 180;
            }
            return naturalDate.getTimeOfEvent(searchResult.date) || 0;
        };

        const events: SunEvents = {
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
 * Calculates the moon's position and phase.
 */
export function NaturalMoonPosition(naturalDate: NaturalDate, latitude: number): MoonPosition {
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
            altitude: Math.max(Horizon(date, observer, moon.ra, moon.dec).altitude, 0),
            phase: MoonPhase(date),
            illumination: Math.cos(MoonPhase(date) * Math.PI / 180)
        };
    } catch (error) {
        console.error('Error in NaturalMoonPosition:', error);
        throw error;
    }
}

/**
 * Calculates moon events for a specific natural date and location.
 */
export function NaturalMoonEvents(naturalDate: NaturalDate, latitude: number): MoonEvents {
    // Validate inputs
    if (!isValidNaturalDate(naturalDate)) {
        throwValidationError('naturalDate', naturalDate, 'NaturalDate instance');
    }
    if (!isValidLatitude(latitude)) {
        throwValidationError('latitude', latitude, 'number between -90 and 90');
    }

    const cacheKey = `MOON_${naturalDate.toDateString()}_${latitude}_${naturalDate.longitude}`;
    
    try {
        const cachedResult = astroCache.get(cacheKey);
        if (cachedResult && 'moonrise' in cachedResult) {
            return cachedResult as MoonEvents;
        }

        const observer = createObserver(latitude, naturalDate.longitude);
        const nadir = new Date(naturalDate.nadir);

        // Helper function to handle edge cases
        const getEventTime = (searchResult: { date: Date } | null): number => {
            if (!searchResult) return 0;
            return naturalDate.getTimeOfEvent(searchResult.date) || 0;
        };

        const events: MoonEvents = {
            moonrise: getEventTime(SearchRiseSet(Body.Moon, observer, +1, nadir, 1)),
            moonset: getEventTime(SearchRiseSet(Body.Moon, observer, -1, nadir, 1)),
            highestAltitude: SearchHourAngle(Body.Moon, observer, 0, nadir).hor.altitude
        };

        astroCache.set(cacheKey, events);
        return events;
    } catch (error) {
        console.error('Error in NaturalMoonEvents:', error);
        throw error;
    }
}

/**
 * Calculates the range of sun positions between winter and summer solstices (average mustaches angle)
 */
export function MustachesRange(naturalDate: NaturalDate, latitude: number): MustachesRange {
    // Validate inputs
    if (!isValidNaturalDate(naturalDate)) {
        throwValidationError('naturalDate', naturalDate, 'NaturalDate instance');
    }
    if (!isValidLatitude(latitude)) {
        throwValidationError('latitude', latitude, 'number between -90 and 90');
    }

    const currentYear = new Date(naturalDate.unixTime).getFullYear();
    const cacheKey = `MUSTACHES_${currentYear}_${latitude}`;
    
    try {
        const cachedResult = astroCache.get(cacheKey);
        if (cachedResult && 'winterSunrise' in cachedResult) {
            return cachedResult as MustachesRange;
        }

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

        const result: MustachesRange = {
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
        };
    }
} 