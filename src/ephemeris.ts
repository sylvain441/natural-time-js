import { AstroTime, Body, Equator, Horizon, MoonPhase, Observer, SearchAltitude, SearchHourAngle, SearchRiseSet, Seasons } from 'astronomy-engine';
import { NaturalDate, cached } from './NaturalDate.js';

// Every function here answers for a NaturalDate seen from a latitude in degrees.
// Results are angles in degrees: events in natural degrees of the day (0 at
// midnight, 180 at noon), positions as the sky gives them.

function observer(naturalDate: NaturalDate, latitude: number): Observer {
    if (!(naturalDate instanceof NaturalDate)) {
        throw new Error(`Invalid naturalDate: ${naturalDate}. Expected NaturalDate instance`);
    }
    if (!(typeof latitude === 'number' && latitude >= -90 && latitude <= 90)) {
        throw new Error(`Invalid latitude: ${latitude}. Expected number between -90 and 90`);
    }
    // The sky is seen from the longitude as given: precision shapes the clock, not the Earth
    return new Observer(latitude, naturalDate.longitude, 0);
}

const at = (naturalDate: NaturalDate, found: AstroTime | null, otherwise: number): number =>
    found ? naturalDate.getTimeOfEvent(found.date) || 0 : otherwise;

/** Azimuth clockwise from north; elevation signed, altitude clamped to the horizon. */
export function NaturalSunPosition(naturalDate: NaturalDate, latitude: number) {
    const place = observer(naturalDate, latitude);
    const date = new Date(naturalDate.unixTime);
    const sun = Equator(Body.Sun, date, place, true, false);
    const { azimuth, altitude } = Horizon(date, place, sun.ra, sun.dec);
    return {
        azimuth,
        elevation: altitude,
        altitude: Math.max(altitude, 0),
        highestAltitude: SearchHourAngle(Body.Sun, place, 0, new Date(naturalDate.nadir)).hor.altitude,
        isAboveHorizon: altitude >= 0
    };
}

export function NaturalSunAltitude(naturalDate: NaturalDate, latitude: number) {
    const { altitude, highestAltitude } = NaturalSunPosition(naturalDate, latitude);
    return { altitude, highestAltitude };
}

/**
 * When the sun rises, sets, crosses -12° (night) and 6° (golden hour) this natural day.
 * Where it never does, the day runs from 0° to 360° in summer and shrinks to 180° in winter.
 */
export function NaturalSunEvents(naturalDate: NaturalDate, latitude: number) {
    const place = observer(naturalDate, latitude);
    // Two precisions of one longitude share a date but not a midnight: the nadir tells them apart
    return cached(`SUN_${naturalDate.nadir}_${latitude}_${naturalDate.longitude}`, () => {
        const nadir = new Date(naturalDate.nadir);
        // Natural days 91 to 273 are summer in the north; both ends belong to both hemispheres
        const d = naturalDate.dayOfYear;
        const summer = latitude >= 0 ? d >= 91 && d <= 273 : d <= 91 || d >= 273;
        const rising = summer ? 0 : 180;
        const setting = summer ? 360 : 180;
        const crossing = (direction: number, altitude: number) =>
            at(naturalDate, SearchAltitude(Body.Sun, place, direction, nadir, 2, altitude), direction > 0 ? rising : setting);
        return {
            sunrise: at(naturalDate, SearchRiseSet(Body.Sun, place, +1, nadir, 1), rising),
            sunset: at(naturalDate, SearchRiseSet(Body.Sun, place, -1, nadir, 1), setting),
            nightStart: crossing(-1, -12),
            nightEnd: crossing(+1, -12),
            morningGoldenHour: crossing(+1, 6),
            eveningGoldenHour: crossing(-1, 6)
        };
    });
}

/** Altitude clamped to the horizon; phase 0° new moon, 180° full. */
export function NaturalMoonPosition(naturalDate: NaturalDate, latitude: number) {
    const place = observer(naturalDate, latitude);
    const date = new Date(naturalDate.unixTime);
    const moon = Equator(Body.Moon, date, place, true, false);
    return {
        altitude: Math.max(Horizon(date, place, moon.ra, moon.dec).altitude, 0),
        phase: MoonPhase(date)
    };
}

/** Moonrise and moonset this natural day, 0 when the moon skips one. */
export function NaturalMoonEvents(naturalDate: NaturalDate, latitude: number) {
    const place = observer(naturalDate, latitude);
    return cached(`MOON_${naturalDate.nadir}_${latitude}_${naturalDate.longitude}`, () => {
        const nadir = new Date(naturalDate.nadir);
        return {
            moonrise: at(naturalDate, SearchRiseSet(Body.Moon, place, +1, nadir, 1), 0),
            moonset: at(naturalDate, SearchRiseSet(Body.Moon, place, -1, nadir, 1), 0),
            highestAltitude: SearchHourAngle(Body.Moon, place, 0, nadir).hor.altitude
        };
    });
}

/**
 * The mustaches: sunrise and sunset at both solstices of the year, seen from NT 0,
 * and how far they swing on average (0 to 90).
 */
export function MustachesRange(naturalDate: NaturalDate, latitude: number) {
    observer(naturalDate, latitude);
    // UTC year: the sky does not care which time zone the machine was sold in
    const year = new Date(naturalDate.unixTime).getUTCFullYear();
    try {
        return cached(`MUSTACHES_${year}_${latitude}`, () => {
            const seasons = Seasons(year);
            const winter = NaturalSunEvents(new NaturalDate(seasons.dec_solstice.date, 0), latitude);
            const summer = NaturalSunEvents(new NaturalDate(seasons.jun_solstice.date, 0), latitude);
            const swing = latitude >= 0
                ? (winter.sunrise - summer.sunrise + summer.sunset - winter.sunset) / 4
                : (summer.sunrise - winter.sunrise + winter.sunset - summer.sunset) / 4;
            return {
                winterSunrise: winter.sunrise,
                winterSunset: winter.sunset,
                summerSunrise: summer.sunrise,
                summerSunset: summer.sunset,
                averageMustacheAngle: Math.min(Math.max(swing, 0), 90)
            };
        });
    } catch {
        // Should the engine give up on a search, a clock without mustaches is still a clock (C does the same)
        return { winterSunrise: 0, winterSunset: 0, summerSunrise: 0, summerSunset: 0, averageMustacheAngle: 0 };
    }
}
