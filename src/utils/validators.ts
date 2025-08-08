/**
 * @module natural-time-js/validators
 * @description Validation utilities for natural time calculations.
 * This module provides functions to validate inputs for natural time operations,
 * ensuring that values are within acceptable ranges and of the correct types.
 */

import { NaturalDate } from '../core/NaturalDate.js';

/**
 * Valid range for latitude values in degrees
 */
const LATITUDE_RANGE = {
    MIN: -90,
    MAX: 90
} as const;

/**
 * Valid range for longitude values in degrees
 */
const LONGITUDE_RANGE = {
    MIN: -180,
    MAX: 180
} as const;

/**
 * Valid range for angle values in degrees
 */
const ANGLE_RANGE = {
    MIN: 0,
    MAX: 360
} as const;

/**
 * Valid ranges for natural date components
 */
const NATURAL_DATE_RANGES = {
    /** Moon (month) number range (1-14) */
    MOON: { MIN: 1, MAX: 14 },
    /** Week of year range (1-53) */
    WEEK: { MIN: 1, MAX: 53 },
    /** Week within moon range (1-4) */
    WEEK_OF_MOON: { MIN: 1, MAX: 4 },
    /** Day of moon range (1-28) */
    DAY_OF_MOON: { MIN: 1, MAX: 28 },
    /** Day of week range (1-7) */
    DAY_OF_WEEK: { MIN: 1, MAX: 7 }
} as const;

/**
 * Validates if a value is a finite number.
 * 
 * This is a utility function that checks if a value is a valid number
 * (not NaN, not Infinity, and actually a number type).
 * 
 * @param value - Value to validate
 * @returns True if value is a valid number
 * 
 * @example
 * isValidNumber(42); // true
 * isValidNumber('42'); // false (string, not number)
 * isValidNumber(NaN); // false
 * isValidNumber(Infinity); // false
 */
export const isValidNumber = (value: unknown): value is number => {
    return typeof value === 'number' && Number.isFinite(value) && !Number.isNaN(value);
};

/**
 * Validates if a latitude value is within the valid range.
 * 
 * Latitude must be a number between -90° (South Pole) and 90° (North Pole).
 * 
 * @param latitude - Latitude in degrees to validate
 * @returns True if latitude is valid
 * 
 * @example
 * isValidLatitude(45.5); // true
 * isValidLatitude(-90); // true (South Pole)
 * isValidLatitude(90); // true (North Pole)
 * isValidLatitude(91); // false (out of range)
 */
export const isValidLatitude = (latitude: unknown): latitude is number => {
    return isValidNumber(latitude) && 
           latitude >= LATITUDE_RANGE.MIN && 
           latitude <= LATITUDE_RANGE.MAX;
};

/**
 * Validates if a longitude value is within the valid range.
 * 
 * Longitude must be a number between -180° and 180°, where:
 * - 0° is the Prime Meridian (Greenwich)
 * - Positive values are East longitude
 * - Negative values are West longitude
 * 
 * @param longitude - Longitude in degrees to validate
 * @returns True if longitude is valid
 * 
 * @example
 * isValidLongitude(0); // true (Prime Meridian)
 * isValidLongitude(180); // true (International Date Line)
 * isValidLongitude(-180); // true (International Date Line)
 * isValidLongitude(181); // false (out of range)
 */
export const isValidLongitude = (longitude: unknown): longitude is number => {
    return isValidNumber(longitude) && 
           longitude >= LONGITUDE_RANGE.MIN && 
           longitude <= LONGITUDE_RANGE.MAX;
};

/**
 * Validates if an angle value is within the valid range.
 * 
 * Angles in natural time are measured in degrees from 0° to 360°,
 * representing a full circle. This is used for time of day and
 * celestial positions.
 * 
 * @param angle - Angle in degrees to validate
 * @returns True if angle is valid
 * 
 * @example
 * isValidAngle(180); // true (half circle)
 * isValidAngle(360); // true (full circle)
 * isValidAngle(0); // true (beginning of circle)
 * isValidAngle(361); // false (out of range)
 * isValidAngle(-1); // false (out of range)
 */
export const isValidAngle = (angle: unknown): angle is number => {
    return isValidNumber(angle) && 
           angle >= ANGLE_RANGE.MIN && 
           angle <= ANGLE_RANGE.MAX;
};

/**
 * Validates if a timestamp is a valid Unix time.
 * 
 * Unix timestamps represent the number of milliseconds since
 * January 1, 1970, 00:00:00 UTC (the Unix epoch).
 * Valid timestamps must be positive numbers.
 * 
 * @param timestamp - Unix timestamp in milliseconds
 * @returns True if timestamp is valid
 * 
 * @example
 * isValidTimestamp(Date.now()); // true
 * isValidTimestamp(0); // false (Unix epoch exactly)
 * isValidTimestamp(-1); // false (before Unix epoch)
 */
export const isValidTimestamp = (timestamp: unknown): timestamp is number => {
    return isValidNumber(timestamp) && timestamp > 0;
};

/**
 * Validates if an object is a properly initialized NaturalDate instance.
 * 
 * This function performs a comprehensive check of a NaturalDate object,
 * verifying that all properties are present and within valid ranges.
 * It's used to ensure that only valid NaturalDate objects are used in calculations.
 * 
 * @param date - Value to validate
 * @returns True if value is a valid NaturalDate instance
 * 
 * @example
 * const naturalDate = new NaturalDate(new Date(), 0);
 * isValidNaturalDate(naturalDate); // true
 * 
 * isValidNaturalDate({}); // false (not a NaturalDate instance)
 * isValidNaturalDate(null); // false
 */
export const isValidNaturalDate = (date: unknown): date is NaturalDate => {
    if (!(date instanceof NaturalDate)) {
        return false;
    }
    
    // Basic property validations
    if (!isValidTimestamp(date.unixTime) || 
        !isValidLongitude(date.longitude) ||
        !isValidNumber(date.year)) {
        return false;
    }

    // Natural calendar validations
    return (
        isValidNumber(date.moon) &&
        date.moon >= NATURAL_DATE_RANGES.MOON.MIN &&
        date.moon <= NATURAL_DATE_RANGES.MOON.MAX &&
        
        isValidNumber(date.week) &&
        date.week >= NATURAL_DATE_RANGES.WEEK.MIN &&
        date.week <= NATURAL_DATE_RANGES.WEEK.MAX &&
        
        isValidNumber(date.weekOfMoon) &&
        date.weekOfMoon >= NATURAL_DATE_RANGES.WEEK_OF_MOON.MIN &&
        date.weekOfMoon <= NATURAL_DATE_RANGES.WEEK_OF_MOON.MAX &&
        
        isValidNumber(date.dayOfMoon) &&
        date.dayOfMoon >= NATURAL_DATE_RANGES.DAY_OF_MOON.MIN &&
        date.dayOfMoon <= NATURAL_DATE_RANGES.DAY_OF_MOON.MAX &&
        
        isValidNumber(date.dayOfWeek) &&
        date.dayOfWeek >= NATURAL_DATE_RANGES.DAY_OF_WEEK.MIN &&
        date.dayOfWeek <= NATURAL_DATE_RANGES.DAY_OF_WEEK.MAX &&
        
        isValidNumber(date.dayOfYear) &&
        date.dayOfYear >= 1 &&
        date.dayOfYear <= date.yearDuration &&
        
        typeof date.isRainbowDay === 'boolean' &&
        isValidAngle(date.time) &&
        isValidTimestamp(date.yearStart) &&
        isValidNumber(date.yearDuration) &&
        isValidTimestamp(date.nadir)
    );
};

/**
 * Validates if a string is a valid cache key.
 * 
 * Cache keys are used for storing and retrieving calculated values
 * to improve performance. Valid keys must be non-empty strings.
 * 
 * @param key - Cache key to validate
 * @returns True if key is valid
 * 
 * @example
 * isValidCacheKey('SUN_2023_45.5_0'); // true
 * isValidCacheKey(''); // false (empty string)
 * isValidCacheKey(123); // false (not a string)
 */
export const isValidCacheKey = (key: unknown): key is string => {
    return typeof key === 'string' && key.length > 0;
};

/**
 * Throws a formatted error for invalid parameters.
 * 
 * This utility function creates consistent error messages for validation failures,
 * making it easier to identify and fix issues with invalid inputs.
 * 
 * @param paramName - Name of the invalid parameter
 * @param value - Invalid value
 * @param expectedType - Description of expected type/format
 * @throws {Error} Formatted validation error
 * 
 * @example
 * // If latitude is invalid:
 * throwValidationError('latitude', 95, 'number between -90 and 90');
 * // Throws: "Error: Invalid latitude: 95. Expected number between -90 and 90"
 */
export const throwValidationError = (paramName: string, value: unknown, expectedType: string): never => {
    throw new Error(`Invalid ${paramName}: ${value}. Expected ${expectedType}`);
}; 