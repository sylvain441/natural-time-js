import { Seasons } from 'astronomy-engine';

const NT_CACHE = {};

/**
 * NATURAL TIME
 * 
 * Natural time is a fresh, elegant, and coherent way of measuring the movements of time here on the Earth.
 * This new time standard is based on common sense and the observation of natural cycles.
 * Learn more: https://naturaltime.app
 * 
 * This JavaScript Class translates gregorian artificial datetime to natural datetime
 * https://github.com/sylvain441/natural-time-js
 * 
 * Special thanks to Don Cross, author of the Astronomy Library to calculate celestial body events
 * https://github.com/cosinekitty/astronomy
 * 
 * @author Biquette 🐐 
 * @contact sylvain441@proton.me
 * 
 */
export class NaturalDate {

	static END_OF_ARTIFICIAL_TIME = 1356091200000; // 2012-12-22 00:00:00 at +180°;
	static MILLISECONDS_PER_DAY = 86400000; // 24*60*60*1000

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
	 * Computes natural date from gregorian date and longitude
	 * @param {Date} date Date object or Unix timestamp
	 * @param {Number} longitude From -180 to + 180
	 */
	constructor(date, longitude) {

		date = new Date(date);
		this.unixTime = date.getTime();
		this.longitude = longitude;
		
		if (Number.isFinite(this.unixTime)) {

			const getYearContext = (artificialYear, longitude) => {

				// We cache astronomical calculations
				let cache_id = `${artificialYear}_${longitude}`;
				if(NT_CACHE?.[cache_id])
					return NT_CACHE[cache_id];

				// Search for December solstices
				let startSolstice = Seasons(artificialYear).dec_solstice.date;
				let endSolstice = Seasons(artificialYear + 1).dec_solstice.date;
		
				// Calculate next time it's midnight at the 180th meridian after solstice (mean time)
				// NB: Midnight at +180° equals midday the previous day at +0°
				let startNewYear = Date.UTC(
						startSolstice.getUTCFullYear(), 
						startSolstice.getUTCMonth(), 
						startSolstice.getUTCDate() + (startSolstice.getUTCHours() >= 12 ? 1 : 0),
						12, 0, 0);
				let endNewYear = Date.UTC(
						endSolstice.getUTCFullYear(), 
						endSolstice.getUTCMonth(), 
						endSolstice.getUTCDate() + (endSolstice.getUTCHours() >= 12 ? 1 : 0),
						12, 0, 0);
		
				return NT_CACHE[cache_id] = {
					start: parseInt(startNewYear + (-longitude + 180) * NaturalDate.MILLISECONDS_PER_DAY/360),
					duration: (endNewYear - startNewYear) / NaturalDate.MILLISECONDS_PER_DAY
				};
			}

			// YEAR START & DURATION
			let yearContext = getYearContext(date.getUTCFullYear()-1, longitude);
			
			// Correction if between the beginning of natural year and the end of the artificial year
			if(this.unixTime - yearContext.start >= yearContext.duration * NaturalDate.MILLISECONDS_PER_DAY)
				yearContext = getYearContext(date.getUTCFullYear(), longitude);
			
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
	 * Returns the time at specified event's date
	 * @param {Date} event 
	 * @returns Time on a 360° scale or null if out of range
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
		return this.toDateString() + " " + this.toTimeString() + " " + this.toLongitudeString();
	}

	/**
	 * Exports current date as a formatted string
	 * @param {String} separator Default: ')'
	 * @returns ex: "004)04)01"
	 */
	toDateString(separator = ')') {
		if(this.isRainbowDay)
			return `${this.toYearString()}${separator}RAINBOW${this.dayOfYear == 366 ? "+" : ""}`;
		else
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
		if(this.longitude == 0)
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