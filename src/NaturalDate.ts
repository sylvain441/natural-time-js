import { Seasons } from 'astronomy-engine';

// One cache for everything the sky makes us compute twice. It forgets its oldest
// entry beyond 512: a clock left open for years, or a longitude slider dragged
// around the Earth, stays small.
const cache = new Map<string, unknown>();

export function cached<T>(key: string, compute: () => T): T {
    if (cache.has(key)) return cache.get(key) as T;
    const value = compute();
    if (cache.size >= 512) cache.delete(cache.keys().next().value!);
    cache.set(key, value);
    return value;
}

export function resetCaches(): void {
    cache.clear();
}

const DAY = 86400000;

// Floats cannot hold 73.57: times 100 it is 7356.999999999999, and a plain cut would
// move the observer to 73.56. One part in a million million, added before the cut,
// puts it back. C and Python add the very same hair.
const HAIR = 1.000000000001;

// The natural year opens at noon UTC on the day of the winter solstice (the next
// day if the solstice falls after noon), then waits for the sun to reach the longitude.
const newYear = (artificialYear: number): number => {
    const solstice = Seasons(artificialYear).dec_solstice.date;
    return Date.UTC(solstice.getUTCFullYear(), solstice.getUTCMonth(),
        solstice.getUTCDate() + (solstice.getUTCHours() >= 12 ? 1 : 0), 12);
};

const yearContext = (artificialYear: number, longitude: number) =>
    cached(`YEAR_${artificialYear}_${longitude}`, () => {
        const start = newYear(artificialYear);
        return {
            start: Math.trunc(start + (-longitude + 180) * DAY / 360),
            duration: (newYear(artificialYear + 1) - start) / DAY
        };
    });

export class NaturalDate {
    static readonly MILLISECONDS_PER_DAY = DAY;

    /** 2012-12-21 12:00 UTC: year 001 begins, artificial time ends. */
    static readonly END_OF_ARTIFICIAL_TIME = Date.UTC(2012, 11, 21, 12);

    readonly unixTime: number;
    /** As given, east positive. */
    readonly longitude: number;
    readonly precision: number;
    /** The longitude the clock runs on: `longitude` cut to `precision` decimals. */
    readonly effectiveLongitude: number;

    readonly year: number;
    /** 1 to 13, and 14 for the Rainbow day(s). */
    readonly moon: number;
    /** 1 to 53. */
    readonly week: number;
    /** 1 to 4. */
    readonly weekOfMoon: number;
    /** Days since END_OF_ARTIFICIAL_TIME. */
    readonly day: number;
    /** 1 to 366. */
    readonly dayOfYear: number;
    /** 1 to 28. */
    readonly dayOfMoon: number;
    /** 1 to 7. */
    readonly dayOfWeek: number;
    readonly isRainbowDay: boolean;
    /** Degrees since natural midnight, 0 to 360: 180 is noon. */
    readonly time: number;
    /** Unix ms. */
    readonly yearStart: number;
    /** 365 or 366 days. */
    readonly yearDuration: number;
    /** Natural midnight that opened the day, unix ms. */
    readonly nadir: number;

    /**
     * @param date `null` or `undefined` for now.
     * @param longitude Degrees, -180 to 180, east positive.
     * @param precision Decimals of longitude the clock runs on, cut and never rounded:
     *   0 gives 360 zones (2.3522 runs on 2), 1 gives 3600 (2.3), `Infinity` the exact sun.
     */
    constructor(date?: Date | number | string | null, longitude?: number, precision = 0) {
        // NaN compares false to everything: only a positive test refuses it
        if (longitude !== undefined && !(typeof longitude === 'number' && longitude >= -180 && longitude <= 180)) {
            throw new Error('Longitude must be between -180 and +180');
        }
        // ?? and not ||: 0 is a moment like any other
        const unixTime = new Date(date ?? Date.now()).getTime();
        if (isNaN(unixTime)) {
            throw new Error('Invalid date provided');
        }

        this.unixTime = unixTime;
        this.longitude = longitude || 0;
        this.precision = precision;
        this.effectiveLongitude = precision === Infinity
            ? this.longitude
            : Math.trunc(this.longitude * Math.pow(10, precision) * HAIR) / Math.pow(10, precision);

        // The natural year began at the last winter solstice, or at the one closing this artificial year
        const artificialYear = new Date(unixTime).getUTCFullYear();
        let context = yearContext(artificialYear - 1, this.effectiveLongitude);
        if (unixTime - context.start >= context.duration * DAY) {
            context = yearContext(artificialYear, this.effectiveLongitude);
        }
        this.yearStart = context.start;
        this.yearDuration = context.duration;

        // C and Python repeat these operations in this order: same floats, same answers
        const elapsed = (unixTime - this.yearStart) / DAY;
        const days = Math.floor(elapsed);
        const weeks = Math.floor(elapsed / 7);

        this.year = new Date(this.yearStart).getUTCFullYear() - 2011;
        this.moon = Math.floor(elapsed / 28) + 1;
        this.week = weeks + 1;
        this.weekOfMoon = weeks % 4 + 1;
        this.day = Math.floor((unixTime - (NaturalDate.END_OF_ARTIFICIAL_TIME + (-this.effectiveLongitude + 180) * DAY / 360)) / DAY);
        this.dayOfYear = days + 1;
        this.dayOfMoon = days % 28 + 1;
        this.dayOfWeek = days % 7 + 1;
        this.isRainbowDay = this.dayOfYear > 13 * 28;
        this.nadir = this.yearStart + days * DAY;
        this.time = (unixTime - this.nadir) * 360 / DAY;
    }

    /** Degrees of `event` within this natural day, or false if it falls outside. */
    getTimeOfEvent(event: Date | number | string): number | false {
        const eventTime = new Date(event).getTime();
        if (eventTime < this.nadir || eventTime > this.nadir + DAY) return false;
        // 360 / DAY first, unlike `time`: the copies in C and Python do the same
        return (eventTime - this.nadir) * (360 / DAY);
    }

    /** `013)04)01 113°00 NT+2` */
    toString(): string {
        return `${this.toDateString()} ${this.toTimeString()} ${this.toLongitudeString()}`;
    }

    /** `013)04)01`, `013)RAINBOW`, `013)RAINBOW+` */
    toDateString(separator = ')'): string {
        if (this.isRainbowDay) {
            return `${this.toYearString()}${separator}RAINBOW${this.dayOfYear === 366 ? '+' : ''}`;
        }
        return `${this.toYearString()}${separator}${this.toMoonString()}${separator}${this.toDayOfMoonString()}`;
    }

    /** `202°99`: cut to `decimals`, never rounded. It is 202° until the sun reaches 203°. */
    toTimeString(decimals = 2): string {
        // The hair added before the cut repairs floats (20263.999999999996 is 20264),
        // it is far thinner than a millisecond of sun
        const scale = Math.pow(10, Math.max(0, Math.trunc(decimals)));
        const total = Math.floor(this.time * scale + 1e-6);
        const whole = Math.floor(total / scale) % 360;
        const fraction = scale > 1 ? (total % scale).toString().padStart(Math.trunc(decimals), '0') : '';
        return `${whole.toString().padStart(3, '0')}°${fraction}`;
    }

    /**
     * `NT+2.3`, `NT-73`, `NTZ` when nothing is left once cut. Decimals default to
     * `precision` (0 when exact): the label names the longitude the clock runs on.
     */
    toLongitudeString(decimals = Number.isFinite(this.precision) ? this.precision : 0): string {
        const scale = Math.pow(10, Math.max(0, Math.trunc(decimals)));
        const scaled = Math.trunc(Math.abs(this.longitude) * scale * HAIR);
        if (scaled === 0) return 'NTZ';

        const sign = this.longitude >= 0 ? '+' : '-';
        const fraction = scale > 1 ? '.' + (scaled % scale).toString().padStart(Math.trunc(decimals), '0') : '';
        return `NT${sign}${Math.floor(scaled / scale)}${fraction}`;
    }

    /** `013`, `-042` before year 1. */
    toYearString(): string {
        return `${this.year < 0 ? '-' : ''}${Math.abs(this.year).toString().padStart(3, '0')}`;
    }

    toMoonString(): string {
        return this.moon.toString().padStart(2, '0');
    }

    toDayOfMoonString(): string {
        return this.dayOfMoon.toString().padStart(2, '0');
    }
}
