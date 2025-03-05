/**
 * @module validators
 * @description Validation utilities for natural time calculations
 */

import { NaturalDate } from '../core/NaturalDate.js';

const LATITUDE_RANGE = { MIN: -90, MAX: 90 };
const LONGITUDE_RANGE = { MIN: -180, MAX: 180 };
const ANGLE_RANGE = { MIN: 0, MAX: 360 };

// Add ranges based on NaturalDate class constraints
const NATURAL_DATE_RANGES = {
    MOON: { MIN: 1, MAX: 14 },
    WEEK: { MIN: 1, MAX: 53 },
    WEEK_OF_MOON: { MIN: 1, MAX: 4 },
    DAY_OF_MOON: { MIN: 1, MAX: 28 },
    DAY_OF_WEEK: { MIN: 1, MAX: 7 }
};

/**
 * Validates if a value is a finite number
 * @param {*} value - Value to validate
 * @returns {boolean} True if value is a valid number
 */
export const isValidNumber = (value) => {
    return typeof value === 'number' && Number.isFinite(value) && !Number.isNaN(value);
};

/**
 * Validates latitude value
 * @param {number} latitude - Latitude to validate
 * @returns {boolean} True if latitude is valid
 */
export const isValidLatitude = (latitude) => {
    return isValidNumber(latitude) && 
           latitude >= LATITUDE_RANGE.MIN && 
           latitude <= LATITUDE_RANGE.MAX;
};

/**
 * Validates longitude value
 */
export const isValidLongitude = (longitude) => {
    return isValidNumber(longitude) && 
           longitude >= LONGITUDE_RANGE.MIN && 
           longitude <= LONGITUDE_RANGE.MAX;
};

/**
 * Validates angle value (0-360 degrees)
 */
export const isValidAngle = (angle) => {
    return isValidNumber(angle) && 
           angle >= ANGLE_RANGE.MIN && 
           angle <= ANGLE_RANGE.MAX;
};

/**
 * Validates unix timestamp
 */
export const isValidTimestamp = (timestamp) => {
    return isValidNumber(timestamp) && timestamp > 0;
};

/**
 * Validates NaturalDate instance with complete property checks
 * @param {*} date - Value to validate
 * @returns {boolean} True if value is a valid NaturalDate instance
 */
export const isValidNaturalDate = (date) => {
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
 * Validates cache key string
 */
export const isValidCacheKey = (key) => {
    return typeof key === 'string' && key.length > 0;
};

/**
 * Throws formatted error for invalid parameters
 * @param {string} paramName - Name of the invalid parameter
 * @param {*} value - Invalid value
 * @param {string} expectedType - Description of expected type/format
 * @throws {Error} Formatted validation error
 */
export const throwValidationError = (paramName, value, expectedType) => {
    throw new Error(
        `Invalid ${paramName}: ${value}. ` +
        `Expected ${expectedType}`
    );
}; 