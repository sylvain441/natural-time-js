# Natural Time JS

A revolutionary approach to time measurement, realigning human experience with nature's rhythms.

## The Natural Time Paradigm

Our current time system - the Gregorian calendar with its arbitrary months and 24-hour days - is a human construct disconnected from natural cycles. Natural Time proposes a return to cosmic truth:


- **Circular Time**: Days measured in 360 degrees, following the sun's continuous journey
- **Location-Aware**: Time calculations adjusted to your longitude, acknowledging Earth's rotation
- **Solar-Anchored Years**: Each year begins at winter solstice, nature's true new year marker
- **13 Perfect Moons**: 28-day cycles matching the moon's natural rhythm (364 days)
- **Rainbow Days**: 1-2 days outside the count to honor year completion and solar alignment


This isn't just a calendar reform - it's a return to measuring time through observable celestial events that have guided humanity for millennia.

## Try Natural Time

🌟 **Experience it yourself!** The best way to understand Natural Time is to try it:


![Natural time app](.github/natural-time-app.jpg)

- **Web App**: Visit [naturaltime.app](https://naturaltime.app/) to see it in action
- **Source Code**: Explore the app's implementation at [github.com/sylvain441/natural-time-app](https://github.com/sylvain441/natural-time-app)
- **Features**: 
  - Works offline
  - Location-aware time calculations
  - Beautiful visualization of natural cycles
  - Powered by this JavaScript library

## Installation

```console
npm install natural-time-js
```

## Usage

### NaturalDate Class

The core class for working with Natural Time:

```javascript
import { NaturalDate } from 'natural-time-js';

// Convert current time at longitude 5.2° E
const naturalDate = new NaturalDate(new Date(), 5.2);
console.log(naturalDate.toString()); // "004)04)01 113°00 NT+5.2"
```

#### Properties

```javascript
// Time Properties
naturalDate.unixTime;    // Artificial gregorian date (UNIX timestamp)
naturalDate.time;        // Current time in degrees (0-359.999...)
naturalDate.nadir;       // Beginning of the day at current longitude (UNIX timestamp)

// Location
naturalDate.longitude;   // Longitude (-180° to +180°)

// Year Properties
naturalDate.year;        // Current year (year 1: 2012/2013)
naturalDate.yearStart;   // Beginning of the year at current longitude (UNIX timestamp)
naturalDate.yearDuration;// Days in current year (365 or 366)
naturalDate.dayOfYear;   // Current day of the year (1-366)

// Moon Properties
naturalDate.moon;        // Current moon (1-13, or 14 for rainbow days)
naturalDate.dayOfMoon;   // Current day of the moon (1-28)
naturalDate.weekOfMoon;  // Current week of the moon (1-4)

// Week Properties
naturalDate.week;        // Current week (1-53)
naturalDate.dayOfWeek;   // Current day of the week (1-7)

// Special Properties
naturalDate.isRainbowDay;// True if current day is rainbow day
naturalDate.day;         // Days since END_OF_ARTIFICIAL_TIME

// Constants
NaturalDate.END_OF_ARTIFICIAL_TIME; // 1356091200000 (2012-12-21 12:00:00 UTC)
NaturalDate.MILLISECONDS_PER_DAY;   // 86400000 (24*60*60*1000)
```

#### Utility Methods

```javascript
naturalDate.toString();              // "004)04)01 113°00 NT+5.2"
naturalDate.toDateString();          // "004)04)01"
naturalDate.toTimeString();          // "113°00"
naturalDate.toLongitudeString();     // "NT+5.2"
naturalDate.toYearString();          // "004"
naturalDate.toMoonString();          // "04"
naturalDate.toDayOfMoonString();     // "01"
```

### Astronomical Functions

Calculate precise celestial events and positions:

```javascript
import { NaturalSunEvents, NaturalMoonPosition } from 'natural-time-js';

// Giza Pyramid coordinates
const latitude = 29.9791;
const longitude = 31.1341;
const naturalDate = new NaturalDate(new Date(), longitude);

// Get sun events for the day
const sunEvents = NaturalSunEvents(naturalDate, latitude);
console.log(sunEvents.sunrise);  // 70.567° (time in natural degrees)
console.log(sunEvents.sunset);   // 287.910°

// Get current moon position and phase
const moonInfo = NaturalMoonPosition(naturalDate, latitude);
console.log(moonInfo.phase);     // 74.861° (percentage of lunar cycle)
console.log(moonInfo.altitude);  // 64.323° (degrees above horizon)
```

## Documentation

The library is fully documented using JSDoc. Generate the documentation with:

```bash
npm run docs
```

For live documentation updates during development:

```bash
npm run docs:dev
```

This creates HTML documentation in the `docs` directory.

## Contribute

Natural time is open to contributions from free-thinking minds. Find your way through Github or email at: [sylvain441@proton.me](mailto:sylvain441@proton.me) to get in touch.

## License

Read [full license](./LICENSE) (Creative Common Zero)

Natural time is completely free to use, play, transform, improve... It operates under the law of Love. Follow your heart, fork it, spoon it! There is no need to ask for permission to do anything with it.

## Acknowledgments

Natural time has been baking for a long time in a goat's mind while traveling around the world. Infinite gratitude to my beloved friends Uncle Skywalker and Ik: your precious insights into the Mayan universe were so inspiring.

Special thanks to Don Cross, author of the Astronomy Library for calculating celestial body events.
[https://github.com/cosinekitty/astronomy](https://github.com/cosinekitty/astronomy)

It was a real pleasure to give birth of natural time during the spring/summer of 2022 in the peaceful French alps.

🌍 One love 🌎

🏔 🐐 🌞 🌈