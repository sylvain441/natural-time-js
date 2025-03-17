/**
 * @module natural-time-js/core
 * @description This module provides the core NaturalDate class that bridges between artificial Gregorian time and Natural Time.
 */

import { Seasons } from 'astronomy-engine';

/**
 * Year context interface for natural date calculations
 */
interface YearContext {
    start: number;
    duration: number;
}

/**
 * Cache for year context calculations to improve performance
 * @private
 */
const yearContextCache: Map<string, YearContext> = new Map();

/**
 * Calculates year context for natural date calculations.
 * 
 * The year context includes:
 * - The start timestamp of the natural year (winter solstice)
 * - The duration of the year in days (365 or 366)
 * 
 * This function handles the conversion between Gregorian calendar years
 * and natural years, accounting for longitude adjustments.
 * 
 * @param artificialYear - Gregorian calendar year
 * @param longitude - Longitude in degrees (-180 to 180)
 * @returns Year context object with start timestamp and duration
 * @private
 */
const calculateYearContext = (artificialYear: number, longitude: number): YearContext => {
    const cacheKey = `${artificialYear}_${longitude}`;
    
    if (yearContextCache.has(cacheKey)) {
        return yearContextCache.get(cacheKey)!;
    }
    
    const startSolstice = Seasons(artificialYear).dec_solstice.date;
    const endSolstice = Seasons(artificialYear + 1).dec_solstice.date;
    
    const startNewYear = Date.UTC(
        startSolstice.getUTCFullYear(),
        startSolstice.getUTCMonth(),
        startSolstice.getUTCDate() + (startSolstice.getUTCHours() >= 12 ? 1 : 0),
        12, 0, 0
    );
    
    const endNewYear = Date.UTC(
        endSolstice.getUTCFullYear(),
        endSolstice.getUTCMonth(),
        endSolstice.getUTCDate() + (endSolstice.getUTCHours() >= 12 ? 1 : 0),
        12, 0, 0
    );
    
    const context: YearContext = {
        start: parseInt(String(startNewYear + (-longitude + 180) * NaturalDate.MILLISECONDS_PER_DAY/360)),
        duration: (endNewYear - startNewYear) / NaturalDate.MILLISECONDS_PER_DAY
    };
    
    yearContextCache.set(cacheKey, context);
    return context;
}

/**
 * Natural date class for converting artificial (Gregorian) dates to natural time.
 * 
 * The NaturalDate class provides a complete implementation of the natural time system,
 * which is based on natural cycles:
 * - Years begin at the winter solstice
 * - Each year has 13 moons (months) of 28 days each, plus 1-2 "rainbow days"
 * - Weeks are 7 days
 * - Time is measured in 360 degrees for a full day cycle
 * 
 * This class handles the conversion between Gregorian calendar dates and natural time,
 * accounting for longitude adjustments to provide location-specific natural time.
 */
export class NaturalDate {
    /**
     * Number of milliseconds in a day
     */
    static readonly MILLISECONDS_PER_DAY: number = 86400000; // 24 * 60 * 60 * 1000

    /**
     * End date of the artificial time era (December 21, 2012 12:00 UTC)
     * This is the reference point for natural time calculations
     */
    static readonly END_OF_ARTIFICIAL_TIME: number = Date.UTC(2012, 11, 21, 12, 0, 0);

    /** Artificial gregorian date (UNIX timestamp) */
    readonly unixTime: number;
    
    /** Longitude in degrees (-180° to +180°) */
    readonly longitude: number;

    /** Current natural year (year 001: winter solstice 2012 > winter solstice 2013) */
    readonly year: number;
    
    /** Current moon (month) in the natural year (1-14) */
    readonly moon: number;

    /** Current week of the natural year (1-53) */
    readonly week: number;
    
    /** Current week within the current moon (1-4) */
    readonly weekOfMoon: number;

    /** Number of days passed since END_OF_ARTIFICIAL_TIME */
    readonly day: number;
    
    /** Current day of the natural year (1-366) */
    readonly dayOfYear: number;
    
    /** Current day of the moon (1-28) */
    readonly dayOfMoon: number;
    
    /** Current day of the week (1-7) */
    readonly dayOfWeek: number;

    /** True if current day is a rainbow day (day beyond the 13 moons) */
    readonly isRainbowDay: boolean;

    /** Current time in natural degrees (0-360°) */
    readonly time: number;

    /** Beginning of the natural year at the current longitude (UNIX timestamp) */
    readonly yearStart: number;
    
    /** Number of days in the current natural year (365 or 366) */
    readonly yearDuration: number;
    
    /** Beginning of the current natural day at the current longitude (UNIX timestamp) */
    readonly nadir: number;

    /**
     * Creates a new natural date instance.
     * 
     * Converts a Gregorian date to natural time based on the specified longitude.
     * The longitude is used to adjust the natural time for the local position on Earth.
     * 
     * @param date - JavaScript Date object, Unix timestamp, or date string
     * @param longitude - Longitude in degrees (-180 to 180)
     * @throws {Error} If inputs are invalid
     * 
     * @example
     * // Create a natural date for the current time in Paris (longitude 2.3522)
     * const parisNaturalDate = new NaturalDate(new Date(), 2.3522);
     * 
     * @example
     * // Create a natural date for a specific time in Tokyo (longitude 139.6503)
     * const tokyoNaturalDate = new NaturalDate('2023-06-21T12:00:00', 139.6503);
     */
    constructor(date: Date | number | string | null | undefined, longitude?: number) {
        // Validate longitude
        if (longitude !== undefined && (typeof longitude !== 'number' || longitude < -180 || longitude > 180)) {
            throw new Error('Longitude must be between -180 and +180');
        }
        
        const dateObj = new Date(date || Date.now());
        if (isNaN(dateObj.getTime())) {
            throw new Error('Invalid date provided');
        }
        
        this.unixTime = dateObj.getTime();
        this.longitude = longitude || 0;
        
        if (Number.isFinite(this.unixTime)) {
            // YEAR START & DURATION
            let yearContext = calculateYearContext(dateObj.getUTCFullYear()-1, this.longitude);
            
            // Correction if between the beginning of natural year and the end of the artificial year
            if(this.unixTime - yearContext.start >= yearContext.duration * NaturalDate.MILLISECONDS_PER_DAY)
                yearContext = calculateYearContext(dateObj.getUTCFullYear(), this.longitude);
            
            this.yearStart = yearContext.start;
            this.yearDuration = yearContext.duration;

            const timeSinceLocalYearStart = (this.unixTime - this.yearStart) / NaturalDate.MILLISECONDS_PER_DAY;

            // YEAR
            this.year = new Date(this.yearStart).getUTCFullYear() - new Date(NaturalDate.END_OF_ARTIFICIAL_TIME).getUTCFullYear() + 1;

            // MOON
            this.moon = Math.floor(timeSinceLocalYearStart / 28) + 1; 
            
            // HEPTAD
            this.week = Math.floor(timeSinceLocalYearStart / 7) + 1;
            this.weekOfMoon = Math.floor(timeSinceLocalYearStart / 7) % 4 + 1;
            
            // DAY
            this.day = Math.floor((this.unixTime - (NaturalDate.END_OF_ARTIFICIAL_TIME + (-this.longitude + 180) * NaturalDate.MILLISECONDS_PER_DAY/360)) / NaturalDate.MILLISECONDS_PER_DAY);
            this.dayOfYear = Math.floor(timeSinceLocalYearStart) + 1;
            this.dayOfMoon = Math.floor(timeSinceLocalYearStart) % 28 + 1;
            this.dayOfWeek = Math.floor(timeSinceLocalYearStart) % 7 + 1;

            // NADIR (i.e day start, midnight)
            this.nadir = this.yearStart + Math.floor(timeSinceLocalYearStart) * NaturalDate.MILLISECONDS_PER_DAY;

            // TIME
            this.time = (this.unixTime - this.nadir) * 360 / NaturalDate.MILLISECONDS_PER_DAY;

            // RAINBOW DAY
            this.isRainbowDay = this.dayOfYear > 13*28;

            return;
        }

        throw new Error('Argument must be a Date object or a Unix timestamp');
    }

    /**
     * Gets the time of an astronomical event in natural degrees.
     * 
     * Converts an event timestamp to natural degrees (0-360°) within the current natural day.
     * Returns false if the event occurs outside the current natural day.
     * 
     * This is useful for calculating the position of celestial events like sunrise, sunset,
     * moonrise, or moonset within the natural time system.
     * 
     * @param event - Event timestamp (Date object, Unix timestamp, or date string)
     * @returns Event time in natural degrees (0-360°) or false if out of range
     * 
     * @example
     * // Calculate sunrise time in natural degrees
     * const naturalDate = new NaturalDate(new Date(), 0);
     * const sunrise = '2023-01-01T06:00:00'; // Example sunrise at 6:00 AM
     * const sunriseInDegrees = naturalDate.getTimeOfEvent(sunrise);
     * console.log(`Sunrise occurs at ${sunriseInDegrees}°`);
     */
    getTimeOfEvent(event: Date | number | string): number | false {
        // Make sure it's a unix timestamp
        const eventTime = new Date(event).getTime();

        // Check if not out of range
        if(eventTime < this.nadir || eventTime > this.nadir + NaturalDate.MILLISECONDS_PER_DAY) 
            return false;

        return (eventTime - this.nadir) * (360 / NaturalDate.MILLISECONDS_PER_DAY);
    }
    
    /**
     * Exports current date as a full ISO formatted string.
     * 
     * The format is: "YYY)MM)DD TTT°DD NT±LLL.L"
     * - YYY: Natural year (padded to 3 digits)
     * - MM: Moon number (padded to 2 digits)
     * - DD: Day of moon (padded to 2 digits)
     * - TTT: Time in degrees (padded to 3 digits)
     * - DD: Decimal degrees (2 digits)
     * - ±LLL.L: Longitude with sign and 1 decimal
     * 
     * @returns {string} Formatted natural date string
     */
    toString(): string {
        return `${this.toDateString()} ${this.toTimeString()} ${this.toLongitudeString()}`;
    }

    /**
     * Exports the date part of the natural date.
     * 
     * @param separator - Separator character between components (default: ')')
     * @returns Formatted date string
     */
    toDateString(separator: string = ')'): string {
        if (this.isRainbowDay) {
            const isSecondRainbowDay = this.dayOfYear === 366;
            return `${this.toYearString()}${separator}RAINBOW${isSecondRainbowDay ? '+' : ''}`;
        }
        return `${this.toYearString()}${separator}${this.toMoonString()}${separator}${this.toDayOfMoonString()}`;
    }

    /**
     * Exports the time part of the natural date.
     * 
     * @param decimals - Number of decimal places for time (default: 2)
     * @param rounding - Rounding increment for time (default: 1)
     * @returns Formatted time string
     */
    toTimeString(decimals: number = 2, rounding: number = 0.01): string {
        let time = this.time;
        
        // Round to the nearest decimal increment
        if (rounding > 0) {
            time = Math.round(time / rounding) * rounding;
            
            // Handle edge case where rounding pushes us to 360°
            if (time >= 360) {
                time = 0;
            }
        }
        
        // Format the integer part to 3 digits
        const integerPart = Math.floor(time).toString().padStart(3, '0');
        
        // Format the decimal part if needed
        const decimalPart = decimals > 0
            ? (time % 1).toFixed(decimals).substring(2).padEnd(decimals, '0')
            : '';
        
        return `${integerPart}°${decimalPart}`;
    }

    /**
     * Exports the longitude part of the natural date.
     * 
     * @param decimals - Number of decimal places for longitude (default: 1)
     * @returns Formatted longitude string
     */
    toLongitudeString(decimals: number = 1): string {
        // Consider longitudes very close to 0 (within 0.5 degrees) as NTZ
        if (Math.abs(this.longitude) < 0.5) {
            return 'NTZ';
        }
        const prefix = 'NT';
        const sign = this.longitude >= 0 ? '+' : '-';
        const absLongitude = Math.abs(this.longitude);
        const integerPart = Math.floor(absLongitude).toString().padStart(1, '0');
        const decimalPart = decimals > 0
            ? (absLongitude % 1).toFixed(decimals).substring(2)
            : '';
        
        return `${prefix}${sign}${integerPart}${decimals > 0 ? '.' + decimalPart : ''}`;
    }

    /**
     * Exports the year part of the natural date.
     * 
     * @returns Formatted year string
     */
    toYearString(): string {
        const absYear = Math.abs(this.year);
        const sign = this.year < 0 ? '-' : '';
        return `${sign}${absYear.toString().padStart(3, '0')}`;
    }

    /**
     * Exports the moon part of the natural date.
     * 
     * @returns Formatted moon string
     */
    toMoonString(): string {
        return this.moon.toString().padStart(2, '0');
    }

    /**
     * Exports the day of moon part of the natural date.
     * 
     * @returns Formatted day of moon string
     */
    toDayOfMoonString(): string {
        return this.dayOfMoon.toString().padStart(2, '0');
    }
}

export { yearContextCache }; 