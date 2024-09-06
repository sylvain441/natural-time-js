import { NaturalDate } from './index.js';
import { Body, Observer, SearchHourAngle, SearchRiseSet, SearchAltitude, MoonPhase, Equator, Horizon } from 'astronomy-engine';

// Improve performance with cached astronomical calculations
const SUN_CACHE = {};
const MOON_CACHE = {};

/**
 * SUN ALTITUDE
 * 
 * Determine the sun altitude and max altitude from a specific naturalDate at given lat/long coordinates
 * @param {NaturalDate} naturalDate
 * @param {Number} latitude
 * @returns Object { altitude, highestAltitude }
 */
export function NaturalSunAltitude(naturalDate, latitude) {

    let observer = new Observer(latitude, naturalDate.longitude, 0);
    let date = new Date(naturalDate.unixTime);

    let sun = Equator(Body.Sun, date, observer, true, false);
    let sunAltitude =  Math.max(Horizon(date, observer, sun.ra, sun.dec).altitude, 0);
    let midday = SearchHourAngle(Body.Sun, observer, 0, new Date(naturalDate.nadir));

    return {
        altitude: sunAltitude, // Current sun altitude
        highestAltitude: midday.hor.altitude // Highest altitude of the sun during the day
    }
}


/**
 * SUN EVENTS
 * 
 * Determine natural day's main sun events like sunrise, sunset, nightStart ...
 * @param {NaturalDate} naturalDate
 * @param {Number} latitude
 * @returns Object { sunrise, sunset, nightStart, nightEnd, morningGoldenHour, eveningGoldenHour }
 */
export function NaturalSunEvents(naturalDate, latitude) {

    let cache_id = naturalDate.toDateString() + latitude + naturalDate.longitude;
    
    if(SUN_CACHE?.[cache_id])
		return SUN_CACHE[cache_id];

    let observer = new Observer(latitude, naturalDate.longitude, 0);
    let nadir = new Date(naturalDate.nadir);

    let isSummer = 
        latitude >= 0 && (naturalDate.dayOfYear >= 91 && naturalDate.dayOfYear <= 273) || // Northern hemisphere summer
        latitude <= 0 && (naturalDate.dayOfYear <= 91 || naturalDate.dayOfYear >= 273); // Southern hemisphere summer

    // SUNRISE & SUNSET
    let sunrise = naturalDate.getTimeOfEvent(SearchRiseSet(Body.Sun, observer, +1, nadir, 1));
    if(!sunrise) sunrise = isSummer ? 0 : 180;
    let sunset = naturalDate.getTimeOfEvent(SearchRiseSet(Body.Sun, observer, -1, nadir, 1));
    if(!sunset) sunset = isSummer ? 360 : 180;

    // NIGHT (-12° altitude)
    let nightStart = naturalDate.getTimeOfEvent(SearchAltitude(Body.Sun, observer, -1, nadir, 2, -12));
    if(!nightStart) nightStart = isSummer ? 360 : 180;
    let nightEnd = naturalDate.getTimeOfEvent(SearchAltitude(Body.Sun, observer, +1, nadir, 2, -12));
    if(!nightEnd) nightEnd = isSummer ? 0 : 180;

    // GOLDEN HOUR (+6° altitude)
    let morningGoldenHour = naturalDate.getTimeOfEvent(SearchAltitude(Body.Sun, observer, +1, nadir, 2, +6));
    if(!morningGoldenHour) morningGoldenHour = isSummer ? 0 : 180;
    let eveningGoldenHour = naturalDate.getTimeOfEvent(SearchAltitude(Body.Sun, observer, -1, nadir, 2, +6));
    if(!eveningGoldenHour) eveningGoldenHour = isSummer ? 360 : 180;
    
	return SUN_CACHE[cache_id] = {
        sunrise: sunrise,
        sunset: sunset,
        nightStart: nightStart,
        nightEnd: nightEnd,
        morningGoldenHour: morningGoldenHour,
        eveningGoldenHour: eveningGoldenHour
    }
}

/**
 * MOON PHASE & POSITION
 * 
 * Determines moon's position in the sky at specific natural date and lat/long position
 * @param {NaturalDate} naturalDate
 * @param {Number} latitude
 * @returns Object { position, phase, altitude, highestAltitude }
 */
export function NaturalMoonPosition(naturalDate, latitude) {

    let observer = new Observer(latitude, naturalDate.longitude, 0);
    let date = new Date(naturalDate.unixTime);

    // PHASE
    let moonPhase = MoonPhase(date);
    let moon = Equator(Body.Moon, date, observer, true, false);

    // POSITION & ALTITUDE
    let moonAltitude = Math.max(Horizon(date, observer, moon.ra, moon.dec).altitude, 0);
    let midmoon = SearchHourAngle(Body.Moon, observer, 0, new Date(naturalDate.nadir));

    return {
        phase: moonPhase, // 0 = new-moon, 90 = first quarter, 180 = full-moon, 270 = last quarter
        altitude: moonAltitude, // Current moon altitude
        highestAltitude: midmoon.hor.altitude // Highest altitude of the moon during the day
    }
}

/**
 * MOON EVENTS
 * 
 * Determine natural day's moonrise and moonset
 * @param {NaturalDate} naturalDate
 * @param {Number} latitude
 * @returns Object { moonrise, moonset }
 */
export function NaturalMoonEvents(naturalDate, latitude) {

    let cache_id = naturalDate.toDateString() + latitude + naturalDate.longitude;
    
    if(MOON_CACHE?.[cache_id])
		return MOON_CACHE[cache_id];

    let observer = new Observer(latitude, naturalDate.longitude, 0);

    // MOONRISE & MOONSET
	let moonrise = SearchRiseSet(Body.Moon, observer, +1, new Date(naturalDate.nadir), 1);
    let moonset = SearchRiseSet(Body.Moon, observer, -1, new Date(naturalDate.nadir), 1);

    return MOON_CACHE[cache_id] = {
        moonrise: naturalDate.getTimeOfEvent(moonrise),
        moonset: naturalDate.getTimeOfEvent(moonset),
    }
}