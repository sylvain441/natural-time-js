/**
 * @module natural-time-js
 * @description Natural time implementation for JavaScript - translates artificial dates to natural dates
 */

import { Seasons } from 'astronomy-engine';

const yearContextCache = new Map();

/**
 * Calculates year context for natural date calculations
 * @param {number} artificialYear - Gregorian calendar year
 * @param {number} longitude - Longitude in degrees (-180 to 180)
 * @returns {{
 *   start: number,
 *   duration: number
 * }} Year context with start timestamp and duration
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
 * Natural date class for converting artificial (Gregorian) dates to natural time
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
	 * @constant {number}
	 */
	static END_OF_ARTIFICIAL_TIME = Date.UTC(2012, 11, 21, 12, 0, 0);

	unixTime; // Artificial gregorian date (UNIX timestamp)
	longitude; // Longitude (between -180° to +180°)

	year; // Current year (year 1: 2012/2013)
	moon; // Current moon (between 1 and 14)

	week; // Current week (between 1 and 53)
	weekOfMoon; // Current week of the moon (between 1 and 4)

	day; // Number of days passed since END_OF_ARTIFICIAL_TIME
	dayOfYear; // Current day of the year (between 1 and 366)
	dayOfMoon; // Current day of the moon (between 1 and 28)
	dayOfWeek; // Current day of the week (between 1 and 7)

	isRainbowDay; // True if current day is rainbow day

	time; // Current time (between 0 and 359°999999...)

	yearStart; // Beginning of the year at the current longitude (UNIX timestamp)
	yearDuration; // Numbers of days in the current year (between 365 and 366)
	nadir; // Beginning of the day at the current longitude (UNIX timestamp)

	/**
	 * Creates a new natural date instance
	 * @param {Date|number} date - JavaScript Date object or Unix timestamp
	 * @param {number} longitude - Longitude in degrees (-180 to 180)
	 * @throws {Error} If inputs are invalid
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
	 * Gets the time of an astronomical event in natural degrees
	 * @param {Date|number} event - Event timestamp
	 * @returns {number|false} Event time in natural degrees (0-360) or false if out of range
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
	 * Exports current date as a full ISO formatted string
	 * @returns ex: "004)04)01 113°00 NT+95"
	 */
	toString() {
		return `${this.toDateString()} ${this.toTimeString()} ${this.toLongitudeString()}`;
	}

	/**
	 * Exports current date as a formatted string
	 * @param {String} separator Default: ')'
	 * @returns ex: "004)04)01"
	 */
	toDateString(separator = ')') {
		if(this.isRainbowDay) {
			return `${this.toYearString()}${separator}RAINBOW${this.dayOfYear === 366 ? "+" : ""}`;
		}
		return `${this.toYearString()}${separator}${this.toMoonString()}${separator}${this.toDayOfMoonString()}`;
	}

	/**
	 * Exports current time as a formatted string
	 * @param {*} decimals Number of decimals (precision) Default: 2
	 * @param {*} rounding Allows granular incrementation of time (ex: 100°10 => 100°15 => 100°20) Default: 1
	 * @returns ex: "113°00" "202°" "63°1234"
	 */
	toTimeString(decimals = 2, rounding = 1) { 
		let timeUnity = parseInt(this.time);
		let timeDecimals = parseInt((this.time % 1) * Math.pow(10, decimals));
		timeDecimals = Math.floor(timeDecimals / rounding) * rounding;

		return String(timeUnity).padStart(3, '0') + "°" + (decimals ? String(timeDecimals).padStart(decimals, '0') : '');
	}

	/**
	 * Exports current longitude as a formatted string
	 * @param {Number} decimals Number of decimals (precision) Default: 1
	 * @returns ex: "NT+95.4" "NT-78"
	 */
	toLongitudeString(decimals = 1) {
		if(Math.abs(Math.round(this.longitude)) == 0)
			return "NTZ"
			
		return "NT" + (this.longitude > 0 ? "+" : "") + this.longitude.toFixed(decimals) + "";
	}

	/**
	 * Exports current year as a formatted string
	 * @returns ex: "004"
	 */
	toYearString() {
		return (this.year < 0 ? "-" : "") + String(Math.abs(this.year)).padStart(3, '0');
	}

	/**
	 * Exports current moon as a formatted string
	 * @returns ex: "04"
	 */
	toMoonString() {
		return String(this.moon).padStart(2, '0');
	}

	/**
	 * Exports current day of the moon as a formatted string
	 * @returns ex: "01"
	 */
	toDayOfMoonString() {
		return String(this.dayOfMoon).padStart(2, '0');
	}
}

// Export the cache for testing purposes
export { yearContextCache };