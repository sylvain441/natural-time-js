# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.0.1]

### Changed
- Published from GitHub Actions through npm trusted publishing, with provenance. No change to the library.
- The golden vectors test accepts the tolerances the file announces, like C and Python: the last bit of a sine differs from one machine to another.

## [3.0.0]

### Breaking
- The validators are gone (`isValidLatitude`, `isValidLongitude`, `isValidAngle`, `isValidTimestamp`, `isValidNaturalDate`, `isValidCacheKey`, `throwValidationError`), and so are `HEMISPHERES`, `SEASONS`, `ANGLES`, `resetYearContextCache` and `resetAstronomyCache`. `resetCaches()` clears everything.
- `toTimeString(decimals = 2)` cuts the time, never rounds it: 202.996° reads `202°99` (was `203°00`). Its `rounding` argument is gone.
- `toLongitudeString` cuts too: at precision 1, 2.3522 is `NT+2.3` (was `NT+2.4`) and 2.96 is `NT+2.9` (was `NT+2.0`). `NTZ` only when nothing is left once cut: at precision 1, 0.5 is `NT+0.5` and -0.7 is `NT-0.7` (both were `NTZ`).
- `new NaturalDate(0)` is 1970-01-01T00:00:00Z, no longer now: only `null` and `undefined` mean now. An empty string or an invalid date throws, and so does a `NaN` longitude.

### Added
- `NaturalSunPosition`: azimuth, signed elevation and whether the sun is up.
- `vectors/natural-time-vectors.jsonl`, what this library answers on 1154 cases, shared byte for byte with natural-time-c and natural-time-py. `npm run vectors` writes it.

### Fixed
- Sun and moon events no longer mix two precisions of the same longitude.
- `MustachesRange` uses the UTC year, not the machine's.
- Sun, moon and mustaches work before 1970.
- The cache forgets its oldest entry beyond 512.
- A longitude that floats cannot hold exactly is no longer cut one step short: 73.57 at precision 2 stays 73.57 (was 73.56).

## [2.0.1] - 2024-03-26

### Fixed
- Fixed Southern hemisphere mustache angle calculations
- Added .npmignore file for better package distribution

## [2.0.0]

### Added
- Switch to typescript
- Documentation with JSDoc
- Complete suite of test files with JEST
- Reorganize files structure (breaking changes)

## [1.1.1]

### Fixed
- Initial public release with basic functionality
- Core natural time calculations
- Basic formatting options 
