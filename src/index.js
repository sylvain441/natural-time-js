/**
 * @module natural-time-js
 * @description Natural time implementation for JavaScript - translates artificial dates to natural dates
 */

// Export the core NaturalDate class
export { NaturalDate, yearContextCache } from './core/NaturalDate.js';

// Export astronomical functions
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

// Export utility functions
export {
    isValidLatitude,
    isValidLongitude,
    isValidAngle,
    isValidTimestamp,
    isValidNaturalDate,
    isValidCacheKey,
    throwValidationError
} from './utils/validators.js'; 