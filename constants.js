/**
 * @module constants
 * @description Collection of constants used for natural time and astronomical calculations
 */

/**
 * Number of milliseconds in a day
 * @constant {number}
 */
export const MILLISECONDS_PER_DAY = 86400000; // 24 * 60 * 60 * 1000

/**
 * End date of the artificial time era (December 21, 2012 12:00 UTC)
 * @constant {number}
 */
export const END_OF_ARTIFICIAL_TIME = Date.UTC(2012, 11, 21, 12, 0, 0);

/**
 * Hemisphere identifiers for geographical calculations
 * @constant
 * @enum {string}
 * @readonly
 */
export const HEMISPHERES = {
    NORTH: 'NORTH',
    SOUTH: 'SOUTH'
}

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
}

/**
 * Solar altitude thresholds in degrees for different daylight conditions
 * @constant
 * @enum {number}
 * @readonly
 */
export const ANGLES = {
    NIGHT_ALTITUDE: -12,
    GOLDEN_HOUR_ALTITUDE: 6
}