/**
 * @module natural-time-js/core
 * @description This module provides the core NaturalDate class that bridges between artificial Gregorian time and Natural Time.
 */

import { Seasons } from 'astronomy-engine';

/**
 * Cache for year context calculations to improve performance
 * @type {Map<string, Object>}
 * @private
 */
const yearContextCache = new Map();

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
 * @param {number} artificialYear - Gregorian calendar year
 * @param {number} longitude - Longitude in degrees (-180 to 180)
 * @returns {Object} Year context object with start timestamp and duration
 * @property {number} start - Unix timestamp for the start of the natural year
 * @property {number} duration - Duration of the year in days (365 or 366)
 * @private
 */
const calculateYearContext = (artificialYear, longitude) => {
	const cacheKey = `${artificialYear}_${longitude}`;
	
	if (yearContextCache.has(cacheKey)) {
		return yearContextCache.get(cacheKey);
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
	
	const context = {
		start: parseInt(startNewYear + (-longitude + 180) * NaturalDate.MILLISECONDS_PER_DAY/360),
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
 * 
 * @class
 */
export class NaturalDate {
	/**
	 * Number of milliseconds in a day
	 * @constant {number}
	 */
	static MILLISECONDS_PER_DAY = 86400000; // 24 * 60 * 60 * 1000

	/**
	 * End date of the artificial time era (December 21, 2012 12:00 UTC)
	 * This is the reference point for natural time calculations
	 * @constant {number}
	 */
	static END_OF_ARTIFICIAL_TIME = Date.UTC(2012, 11, 21, 12, 0, 0);

	/** Artificial gregorian date (UNIX timestamp) */
	unixTime;
	
	/** Longitude in degrees (-180° to +180°) */
	longitude;

	/** Current natural year (year 001: winter solstice 2012 > winter solstice 2013) */
	year;
	
	/** Current moon (month) in the natural year (1-14) */
	moon;

	/** Current week of the natural year (1-53) */
	week;
	
	/** Current week within the current moon (1-4) */
	weekOfMoon;

	/** Number of days passed since END_OF_ARTIFICIAL_TIME */
	day;
	
	/** Current day of the natural year (1-366) */
	dayOfYear;
	
	/** Current day of the moon (1-28) */
	dayOfMoon;
	
	/** Current day of the week (1-7) */
	dayOfWeek;

	/** True if current day is a rainbow day (day beyond the 13 moons) */
	isRainbowDay;

	/** Current time in natural degrees (0-360°) */
	time;

	/** Beginning of the natural year at the current longitude (UNIX timestamp) */
	yearStart;
	
	/** Number of days in the current natural year (365 or 366) */
	yearDuration;
	
	/** Beginning of the current natural day at the current longitude (UNIX timestamp) */
	nadir;

	/**
	 * Creates a new natural date instance.
	 * 
	 * Converts a Gregorian date to natural time based on the specified longitude.
	 * The longitude is used to adjust the natural time for the local position on Earth.
	 * 
	 * @param {Date|number} date - JavaScript Date object or Unix timestamp
	 * @param {number} longitude - Longitude in degrees (-180 to 180)
	 * @throws {Error} If inputs are invalid
	 * 
	 * @example
	 * // Create a natural date for the current time in Paris (longitude 2.3522)
	 * const parisNaturalDate = new NaturalDate(new Date(), 2.3522);
	 * 
	 * @example
	 * // Create a natural date for a specific time in Tokyo (longitude 139.6503)
	 * const tokyoNaturalDate = new NaturalDate(new Date('2023-06-21T12:00:00'), 139.6503);
	 */
	constructor(date, longitude) {
		// Validate longitude
		if (longitude !== undefined && (typeof longitude !== 'number' || longitude < -180 || longitude > 180)) {
			throw new Error('Longitude must be between -180 and +180');
		}
		
		date = new Date(date || Date.now());
		if (isNaN(date.getTime())) {
			throw new Error('Invalid date provided');
		}
		
		this.unixTime = date.getTime();
		this.longitude = longitude || 0;
		
		if (Number.isFinite(this.unixTime)) {
			// YEAR START & DURATION
			let yearContext = calculateYearContext(date.getUTCFullYear()-1, longitude);
			
			// Correction if between the beginning of natural year and the end of the artificial year
			if(this.unixTime - yearContext.start >= yearContext.duration * NaturalDate.MILLISECONDS_PER_DAY)
				yearContext = calculateYearContext(date.getUTCFullYear(), longitude);
			
			this.yearStart = yearContext.start;
			this.yearDuration = yearContext.duration;

			let timeSinceLocalYearStart = (this.unixTime - this.yearStart) / NaturalDate.MILLISECONDS_PER_DAY;

			// YEAR
			this.year = new Date(this.yearStart).getUTCFullYear() - new Date(NaturalDate.END_OF_ARTIFICIAL_TIME).getUTCFullYear()+ 1;

			// MOON
			this.moon = parseInt(timeSinceLocalYearStart / 28) + 1; 
			
			// HEPTAD
			this.week = parseInt(timeSinceLocalYearStart / 7) + 1;
			this.weekOfMoon = parseInt(timeSinceLocalYearStart / 7) % 4 + 1;
			
			// DAY
			this.day = parseInt((this.unixTime - (NaturalDate.END_OF_ARTIFICIAL_TIME + (-longitude + 180) * NaturalDate.MILLISECONDS_PER_DAY/360)) / NaturalDate.MILLISECONDS_PER_DAY);
			this.dayOfYear = parseInt(timeSinceLocalYearStart) + 1;
			this.dayOfMoon = parseInt(timeSinceLocalYearStart) % 28 + 1;
			this.dayOfWeek = parseInt(timeSinceLocalYearStart) % 7 + 1;

			// NADIR (i.e day start, midnight)
			this.nadir = this.yearStart + parseInt(timeSinceLocalYearStart) * NaturalDate.MILLISECONDS_PER_DAY;

			// TIME
			this.time = (this.unixTime - this.nadir) * 360 / NaturalDate.MILLISECONDS_PER_DAY;

			// RAINBOW DAY
			this.isRainbowDay = this.dayOfYear > 13*28;

			return;
		}

		throw 'Argument must be a Date object or a Unix timestamp';
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
	 * @param {Date|number} event - Event timestamp (Date object or Unix timestamp)
	 * @returns {number|false} Event time in natural degrees (0-360°) or false if out of range
	 * 
	 * @example
	 * // Calculate sunrise time in natural degrees
	 * const naturalDate = new NaturalDate(new Date(), 0);
	 * const sunrise = new Date(naturalDate.unixTime);
	 * sunrise.setHours(6, 0, 0); // Example sunrise at 6:00 AM
	 * const sunriseInDegrees = naturalDate.getTimeOfEvent(sunrise);
	 * console.log(`Sunrise occurs at ${sunriseInDegrees}°`);
	 */
	getTimeOfEvent(event) {
		// Make sure it's a unix timestamp
		event = new Date(event).getTime();

		// Check if not out of range
		if(event < this.nadir || event > this.nadir + NaturalDate.MILLISECONDS_PER_DAY) 
			return false;

		return (event - this.nadir) * (360 / NaturalDate.MILLISECONDS_PER_DAY);
	}
	
	/**
	 * Exports current date as a full ISO formatted string.
	 * 
	 * The format is: "YYY)MM)DD TTT°DD NT±LLL.L"
	 * - YYY: Natural year (padded to 3 digits)
	 * - MM: Moon number (padded to 2 digits)
	 * - DD: Day of moon (padded to 2 digits)
	 * - TTT: Time in degrees (padded to 3 digits)
	 * - DD: Time decimal part (padded based on decimals parameter)
	 * - ±LLL.L: Longitude with sign and decimal
	 * 
	 * For rainbow days, the format changes to: "YYY)RAINBOW TTT°DD NT±LLL.L"
	 * 
	 * @returns {string} Formatted natural date string
	 * 
	 * @example
	 * const naturalDate = new NaturalDate(new Date(), 5.2);
	 * console.log(naturalDate.toString());
	 * // Example output: "011)04)15 113°25 NT+5.2"
	 */
	toString() {
		return `${this.toDateString()} ${this.toTimeString()} ${this.toLongitudeString()}`;
	}

	/**
	 * Exports current date as a formatted string.
	 * 
	 * The format is: "YYY)MM)DD" where:
	 * - YYY: Natural year (padded to 3 digits)
	 * - MM: Moon number (padded to 2 digits)
	 * - DD: Day of moon (padded to 2 digits)
	 * 
	 * For rainbow days, the format changes to: "YYY)RAINBOW" or "YYY)RAINBOW+"
	 * where the "+" indicates the second rainbow day in natural leap years (not same as Gregorian leap years).
	 * 
	 * @param {string} separator - Character to use as separator (default: ')')
	 * @returns {string} Formatted date string
	 * 
	 * @example
	 * const naturalDate = new NaturalDate(new Date(), 0);
	 * console.log(naturalDate.toDateString());
	 * // Example output: "011)04)15"
	 * 
	 * @example
	 * // Using a different separator
	 * console.log(naturalDate.toDateString('-'));
	 * // Example output: "011-04-15"
	 */
	toDateString(separator = ')') {
		if(this.isRainbowDay) {
			return `${this.toYearString()}${separator}RAINBOW${this.dayOfYear === 366 ? "+" : ""}`;
		}
		return `${this.toYearString()}${separator}${this.toMoonString()}${separator}${this.toDayOfMoonString()}`;
	}

	/**
	 * Exports current time as a formatted string.
	 * 
	 * The format is: "TTT°DD" where:
	 * - TTT: Time in degrees (padded to 3 digits)
	 * - DD: Time decimal part (padded based on decimals parameter)
	 * 
	 * @param {number} decimals - Number of decimal places to include (default: 2)
	 * @param {number} rounding - Rounding increment for decimal part (default: 1)
	 * @returns {string} Formatted time string
	 * 
	 * @example
	 * const naturalDate = new NaturalDate(new Date(), 0);
	 * console.log(naturalDate.toTimeString());
	 * // Example output: "113°25"
	 * 
	 * @example
	 * // With different precision
	 * console.log(naturalDate.toTimeString(1));
	 * // Example output: "113°3"
	 * 
	 * @example
	 * // With rounding to nearest 5
	 * console.log(naturalDate.toTimeString(2, 5));
	 * // Example output: "113°25" (rounded to nearest 5)
	 */
	toTimeString(decimals = 2, rounding = 1) { 
		let timeUnity = parseInt(this.time);
		let timeDecimals = parseInt((this.time % 1) * Math.pow(10, decimals));
		timeDecimals = Math.floor(timeDecimals / rounding) * rounding;

		return String(timeUnity).padStart(3, '0') + "°" + (decimals ? String(timeDecimals).padStart(decimals, '0') : '');
	}

	/**
	 * Exports current longitude as a formatted string.
	 * 
	 * The format is: "NT±LLL.L" where:
	 * - ±: Sign of longitude (+ for east, - for west)
	 * - LLL.L: Longitude value with decimal places
	 * 
	 * For the prime meridian (0°), the special format "NTZ" is used.
	 * 
	 * @param {number} decimals - Number of decimal places to include (default: 1)
	 * @returns {string} Formatted longitude string
	 * 
	 * @example
	 * const naturalDate = new NaturalDate(new Date(), 5.2);
	 * console.log(naturalDate.toLongitudeString());
	 * // Example output: "NT+5.2"
	 * 
	 * @example
	 * const naturalDateWest = new NaturalDate(new Date(), -75.1);
	 * console.log(naturalDateWest.toLongitudeString());
	 * // Example output: "NT-75.1"
	 */
	toLongitudeString(decimals = 1) {
		if(Math.abs(Math.round(this.longitude)) == 0)
			return "NTZ"
			
		return "NT" + (this.longitude > 0 ? "+" : "") + this.longitude.toFixed(decimals) + "";
	}

	/**
	 * Exports current year as a formatted string.
	 * 
	 * The year is padded to 3 digits and includes a negative sign for years before
	 * the start of natural time (before 2012/2013).
	 * 
	 * @returns {string} Formatted year string
	 * 
	 * @example
	 * const naturalDate = new NaturalDate(new Date(), 0);
	 * console.log(naturalDate.toYearString());
	 * // Example output: "011" (for year 11)
	 */
	toYearString() {
		return (this.year < 0 ? "-" : "") + String(Math.abs(this.year)).padStart(3, '0');
	}

	/**
	 * Exports current moon as a formatted string.
	 * 
	 * The moon number is padded to 2 digits.
	 * 
	 * @returns {string} Formatted moon string
	 * 
	 * @example
	 * const naturalDate = new NaturalDate(new Date(), 0);
	 * console.log(naturalDate.toMoonString());
	 * // Example output: "04" (for the 4th moon)
	 */
	toMoonString() {
		return String(this.moon).padStart(2, '0');
	}

	/**
	 * Exports current day of the moon as a formatted string.
	 * 
	 * The day number is padded to 2 digits.
	 * 
	 * @returns {string} Formatted day of moon string
	 * 
	 * @example
	 * const naturalDate = new NaturalDate(new Date(), 0);
	 * console.log(naturalDate.toDayOfMoonString());
	 * // Example output: "15" (for the 15th day of the moon)
	 */
	toDayOfMoonString() {
		return String(this.dayOfMoon).padStart(2, '0');
	}
}

// Export the cache for testing purposes
export { yearContextCache }; 